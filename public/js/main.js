/* ── LOADER ── */
window.addEventListener('load', () => setTimeout(() => document.getElementById('loader')?.classList.add('gone'), 900))

/* ── CURSOR ── */
;(function(){
  const c = document.getElementById('cursor')
  const t = document.getElementById('cursorTrail')
  if(!c||!t) return
  let mx=0,my=0,tx=0,ty=0
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY
    c.style.left=mx+'px'; c.style.top=my+'px'
  })
  ;(function loop(){ tx+=(mx-tx)*.1; ty+=(my-ty)*.1; t.style.left=tx+'px'; t.style.top=ty+'px'; requestAnimationFrame(loop) })()
  document.querySelectorAll('a,button,.cat-chip,.mood-btn,.product-card').forEach(el => {
    el.addEventListener('mouseenter', ()=>c.classList.add('big'))
    el.addEventListener('mouseleave', ()=>c.classList.remove('big'))
  })
})()

/* ── NAVBAR ── */
window.addEventListener('scroll', () => document.querySelector('.navbar')?.classList.toggle('scrolled', scrollY>40), { passive:true })

/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('toast')
  if(!t) return
  document.getElementById('toastMsg').textContent = msg
  t.classList.add('show')
  clearTimeout(t._t)
  t._t = setTimeout(() => t.classList.remove('show'), 2500)
}

/* ── CART ── */
const CART_KEY = 'fs-cart'
function getCart()      { return JSON.parse(localStorage.getItem(CART_KEY)||'[]') }
function saveCart(c)    { localStorage.setItem(CART_KEY, JSON.stringify(c)) }
function updateCartCount() {
  const n = getCart().reduce((s,i)=>s+i.qty,0)
  document.querySelectorAll('#navCartCount').forEach(el => el.textContent = n)
}
function addToCart(id, name, price, emoji) {
  const cart = getCart()
  const ex   = cart.find(c => c.id === id)
  if(ex) ex.qty++; else cart.push({ id, name, price:+price, emoji, qty:1 })
  saveCart(cart); updateCartCount()
  showToast(emoji + ' ' + name + ' da vao gio!')
}

document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault()
    const { id, name, price, emoji } = btn.dataset
    addToCart(id, name, price, emoji)
    const orig = btn.textContent
    btn.textContent = '✓'; btn.style.transform = 'scale(.9)'
    setTimeout(() => { btn.textContent=orig; btn.style.transform='' }, 1200)
  })
})

/* ── WISHLIST ── */
document.querySelectorAll('.wish-btn').forEach(btn => {
  const key = 'fs-wish-'+btn.dataset.id
  if(localStorage.getItem(key)) { btn.textContent='❤️'; btn.classList.add('liked') }
  btn.addEventListener('click', e => {
    e.preventDefault()
    btn.classList.toggle('liked')
    btn.textContent = btn.classList.contains('liked') ? '❤️' : '🤍'
    btn.classList.contains('liked') ? localStorage.setItem(key,'1') : localStorage.removeItem(key)
    btn.style.transform = 'scale(1.3)'; setTimeout(()=>btn.style.transform='',250)
  })
})

/* ── SCROLL REVEAL ── */
new IntersectionObserver((entries) => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('shown') }), { threshold:.1 })
  .observe = (function(orig){
    const obs = new IntersectionObserver((entries) => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('shown') }), {threshold:.1})
    document.querySelectorAll('.reveal,.why-card,.testi-card').forEach(el => obs.observe(el))
    return obs
  })()

/* ── AI MOOD ── */
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', async function(){
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'))
    this.classList.add('active')
    const res = document.getElementById('moodResult')
    res.classList.remove('active')
    res.innerHTML = '<span>⏳</span><span style="animation:pulse 1s infinite">AI dang goi y cho ban...</span>'
    try {
      const r = await fetch('/ai/mood', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mood: this.dataset.mood }) })
      const d = await r.json()
      res.classList.add('active')
      res.innerHTML = '<span>✨</span><span>' + d.result + '</span>'
    } catch {
      res.innerHTML = '<span>😅</span><span>Them ANTHROPIC_API_KEY vao .env de su dung tinh nang AI!</span>'
    }
  })
})

/* ── CHATBOT ── */
;(function(){
  const fab   = document.getElementById('chatFab')
  const win   = document.getElementById('chatWin')
  const close = document.getElementById('chatCloseBtn')
  const msgs  = document.getElementById('chatMsgs')
  const input = document.getElementById('chatInput')
  const send  = document.getElementById('chatSend')
  const type  = document.getElementById('chatTyping')
  if(!fab) return
  let open=false, hist=[], loading=false

  function toggle() { open=!open; win.classList.toggle('open',open); fab.classList.toggle('open',open); if(open) setTimeout(()=>input?.focus(),300) }
  fab.onclick   = toggle
  close.onclick = toggle

  function addMsg(text, role) {
    const d = document.createElement('div')
    d.className = 'chat-msg '+role; d.textContent = text
    type.before(d); msgs.scrollTop = msgs.scrollHeight
  }

  async function doSend() {
    const txt = input.value.trim(); if(!txt||loading) return
    loading=true; addMsg(txt,'user'); hist.push({role:'user',content:txt}); input.value=''; input.style.height='auto'
    type.classList.add('show'); msgs.scrollTop = msgs.scrollHeight
    try {
      const r = await fetch('/ai/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:txt, history:hist.slice(-6)}) })
      const d = await r.json()
      type.classList.remove('show')
      const reply = d.reply || d.error || 'Co loi xay ra!'
      addMsg(reply,'bot'); hist.push({role:'assistant',content:reply})
    } catch { type.classList.remove('show'); addMsg('Khong ket noi duoc. Them API key vao .env nhe!','bot') }
    finally { loading=false }
  }

  send.onclick = doSend
  input.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend()} })
  input.addEventListener('input', function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,90)+'px' })
})()

/* ── NEWSLETTER ── */
document.querySelector('.newsletter-form')?.addEventListener('submit', e => {
  e.preventDefault()
  const btn = e.target.querySelector('button')
  btn.textContent = '✓ Da dang ky!'
  btn.style.background = 'linear-gradient(135deg,#52C41A,#2E7D32)'
  showToast('Cam on ban da dang ky! 🎉')
  e.target.querySelector('input').value = ''
  setTimeout(() => { btn.textContent='Dang ky'; btn.style.background='' }, 3000)
})

/* Init */
updateCartCount()
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function toggleUserMenu() {
    const menu = document.getElementById("userDropdown");
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }

  // Click ra ngoài sẽ đóng menu
  document.addEventListener("click", function(e){
    const menu = document.getElementById("userDropdown");
    const toggle = document.querySelector(".nav-user-toggle");
    if(!toggle.contains(e.target) && !menu.contains(e.target)){
      menu.style.display = "none";
    }
  });

  async function api(url,body) {
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  return r.json()
}
function atoast(msg,type='ok') {
  const t=document.getElementById('aToast'); if(!t) return
  document.getElementById('aToastMsg').textContent = (type==='ok'?'✓ ':'✕ ')+msg
  t.className='a-toast '+type; t.classList.add('show')
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2500)
}
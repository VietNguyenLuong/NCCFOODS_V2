/* Admin shared JS */
function om(id)  { document.getElementById(id).classList.add('open');  document.body.style.overflow='hidden' }
function cm(id)  { document.getElementById(id).classList.remove('open'); document.body.style.overflow='' }
function atoast(msg,type='ok') {
  const t=document.getElementById('aToast'); if(!t) return
  document.getElementById('aToastMsg').textContent = (type==='ok'?'✓ ':'✕ ')+msg
  t.className='a-toast '+type; t.classList.add('show')
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2500)
}
async function api(url,body) {
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  return r.json()
}
function sfm(formId, url, onSuccess) {
  document.getElementById(formId)?.addEventListener('submit', async function(e) {
    e.preventDefault()
    const body = Object.fromEntries(new FormData(this))
    const r    = await api(url, body)
    if(r.success) { atoast('Thanh cong!','ok'); onSuccess() }
    else atoast(r.message||'Co loi xay ra!','err')
  })
}
/* Close modal on overlay click */
document.querySelectorAll('.m-overlay').forEach(o => o.addEventListener('click', e => { if(e.target===o) cm(o.id) }))

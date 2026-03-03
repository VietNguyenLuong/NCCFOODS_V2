const express = require('express')
const router  = express.Router()

async function claude(system, user, history=[]) {
  const msgs = [...history.slice(-6), { role:'user', content: user }]
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY||'', 'anthropic-version':'2023-06-01' },
    body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:350, system, messages: msgs })
  })
  const d = await r.json()
  return d.content?.[0]?.text || 'Xin loi, co loi xay ra.'
}

router.post('/mood', async (req, res) => {
  const { mood } = req.body
  const reply = await claude(
    'Ban la chuyen gia dinh duong tai FruitShop. Khi nguoi dung cho biet tam trang, hay goi y 2-3 loai hoa qua phu hop voi ly do ngan gon, than thien, co emoji. Toi da 80 tu.',
    'Tam trang: ' + mood
  ).catch(() => 'AI tam thoi khong kha dung.')
  res.json({ result: reply })
})

router.post('/chat', async (req, res) => {
  const { message, history } = req.body
  const reply = await claude(
    'Ban la FruitBot - tro ly dinh duong AI cua FruitShop. Tu van ve hoa qua, dinh duong, suc khoe. Tieng Viet, than thien, co emoji. Toi da 100 tu.',
    message, history
  ).catch(() => 'FruitBot tam nghi, thu lai nhe!')
  res.json({ reply })
})

module.exports = router

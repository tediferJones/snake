import t from '@/lib/getTag'

document.body.appendChild(
  t('h1', { textContent: 'hello world', className: 'bg-red-500 text-white' })
)

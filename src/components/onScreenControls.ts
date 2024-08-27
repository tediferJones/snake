import t from '@/lib/getTag'

export default function onScreenControls({ changeDirFunc }: { changeDirFunc: Function }) {
  return t('div', { className: 'grid grid-cols-3 mx-auto' }, [
    t('div'),
    t('div', { className: 'aspect-square text-7xl', textContent: '⬆', onclick: () => changeDirFunc('ArrowUp') }),
    t('div'),
    t('div', { className: 'aspect-square text-7xl', textContent: '⬅', onclick: () => changeDirFunc('ArrowLeft') }),
    t('div'),
    t('div', { className: 'aspect-square text-7xl', textContent: '➡', onclick: () => changeDirFunc('ArrowRight') }),
    t('div'),
    t('div', { className: 'aspect-square text-7xl', textContent: '⬇', onclick: () => changeDirFunc('ArrowDown') }),
    t('div'),
  ])
}

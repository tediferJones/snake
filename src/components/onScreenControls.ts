import t from '@/lib/getTag'

export default function onScreenControls({ changeDirFunc }: { changeDirFunc: Function }) {
  return t('div', { id: 'onScreenControls', className: 'mx-auto aspect-square w-3/4 flex justify-center items-center' }, [
    t('div', { className: 'aspect-square w-3/4 grid grid-cols-2 mx-auto rotate-45' /*hidden'*/ }, [
      t('div', {
        className: 'aspect-square bg-black m-2 flex justify-center items-center',
        onclick: () => changeDirFunc('ArrowUp')
      }, [
          t('div', { className: 'mb-8 mr-8 -rotate-45 w-0 h-0 border-l-[50px] border-r-[50px] border-b-[75px] border-transparent border-b-white' }),
        ]),
      t('div', {
        className: 'aspect-square bg-black m-2 flex justify-center items-center',
        onclick: () => changeDirFunc('ArrowRight')
      }, [
          t('div', { className: 'mb-8 ml-8 rotate-45 w-0 h-0 border-l-[50px] border-r-[50px] border-b-[75px] border-transparent border-b-white' }),
        ]),
      t('div', {
        className: 'aspect-square bg-black m-2 flex justify-center items-center',
        onclick: () => changeDirFunc('ArrowLeft')
      }, [
          t('div', { className: 'mt-8 mr-8 rotate-45 w-0 h-0 border-l-[50px] border-r-[50px] border-t-[75px] border-transparent border-t-white' }),
        ]),
      t('div', {
        className: 'aspect-square bg-black m-2 flex justify-center items-center',
        onclick: () => changeDirFunc('ArrowDown')
      }, [
          t('div', { className: 'mt-8 ml-8 -rotate-45 w-0 h-0 border-l-[50px] border-r-[50px] border-t-[75px] border-transparent border-t-white' }),
        ]),
    ])
  ])

  // return t('div', { id: 'onScreenControls', className: 'grid grid-cols-3 mx-auto hidden' }, [
  //   t('div'),
  //   t('div', { className: 'aspect-square text-7xl', textContent: '⬆', onclick: () => changeDirFunc('ArrowUp') }),
  //   t('div'),
  //   t('div', { className: 'aspect-square text-7xl', textContent: '⬅', onclick: () => changeDirFunc('ArrowLeft') }),
  //   t('div'),
  //   t('div', { className: 'aspect-square text-7xl', textContent: '➡', onclick: () => changeDirFunc('ArrowRight') }),
  //   t('div'),
  //   t('div', { className: 'aspect-square text-7xl', textContent: '⬇', onclick: () => changeDirFunc('ArrowDown') }),
  //   t('div'),
  // ])
}

import type { ClientGameData } from '@/types';
import t from '@/lib/getTag';

export default function board({ boardSize }: { boardSize: ClientGameData['boardSize'] }) {
  return t('div', { className: 'w-full md:w-1/2 mx-8 border-4 border-black flex flex-col bg-gray-200' },
    [ ...Array(boardSize).keys() ].map(row => {
      return t('div', { className: 'flex flex-1' },
        [ ...Array(boardSize).keys() ].map(col => {
          return t('div', {
            id: `cell-${row}-${col}`,
            className: `aspect-square flex-1 flex justify-center items-center border-[1px] border-gray-300`,
          })
        })
      )
    })
  )
}

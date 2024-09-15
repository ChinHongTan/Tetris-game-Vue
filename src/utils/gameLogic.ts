export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const createEmptyBoard = () =>
  Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0))

const TETROMINOS = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ]
}

export const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS)
  return TETROMINOS[keys[Math.floor(Math.random() * keys.length)]]
}

export const rotatePiece = (piece: number[][]) => {
  const rotated = piece[0].map((_, index) => piece.map((row) => row[index]).reverse())
  return rotated
}

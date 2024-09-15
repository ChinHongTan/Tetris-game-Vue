export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export interface Piece {
  shape: number[][]
  rotationState: number
}

export const createPiece = (shape: number[][]): Piece => ({
  shape,
  rotationState: 0
})

export const createEmptyBoard = () =>
  Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0))

export const TETROMINOS: { [key: string]: number[][] } = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
}

export const randomTetromino = (): Piece => {
  const keys = Object.keys(TETROMINOS)
  const shape = TETROMINOS[keys[Math.floor(Math.random() * keys.length)]]
  return createPiece(shape)
}

export const rotatePiece = (piece: Piece, direction: 1 | -1 = 1): Piece => {
  const rotated = piece.shape[0].map((_, index) => piece.shape.map((row) => row[index]).reverse())
  return {
    shape: rotated,
    rotationState: (piece.rotationState + direction + 4) % 4
  }
}

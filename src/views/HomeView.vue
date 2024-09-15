<template>
  <v-container class="text-center">
    <h1 class="mb-4">Tetris Game</h1>
    <div class="d-flex justify-center mb-4">
      <tetris-board :board="gameBoard" />
      <div class="ml-4" v-if="hasGameStarted">
        <h2>Score: {{ isGameOver ? finalStats.score : score }}</h2>
        <h3>Level: {{ isGameOver ? finalStats.level : level }}</h3>
        <h3>Lines Cleared: {{ isGameOver ? finalStats.linesCleared : linesCleared }}</h3>
        <next-piece-preview :piece="nextPiece" />
        <held-piece-preview :piece="heldPiece" />
      </div>
    </div>
    <h3 v-if="isGameOver" class="error--text">Game Over</h3>
    <v-btn @click="handleGameControl" @keydown.space.prevent color="primary" class="mr-2">{{
      gameControlButtonText
    }}</v-btn>
    <v-btn @click="resetGame" color="error" :disabled="!hasGameStarted"> Reset Game </v-btn>

    <!-- Game Statistics Section -->
    <v-card class="mt-4 pa-4">
      <h3 class="mb-2">Game Statistics</h3>
      <v-row>
        <v-col cols="6" sm="4">
          <p>Total Pieces: {{ gameStats.totalPiecesPlaced || 0 }}</p>
        </v-col>
        <v-col cols="6" sm="4">
          <p>Total Lines: {{ gameStats.totalLinesCleared || 0 }}</p>
        </v-col>
        <v-col cols="6" sm="4">
          <p>Longest Game: {{ formatTime(gameStats.longestGame) }}</p>
        </v-col>
        <v-col cols="6" sm="4">
          <p>Highest Score: {{ gameStats.highestScore || 0 }}</p>
        </v-col>
        <v-col cols="6" sm="4">
          <p>Games Played: {{ gameStats.gamesPlayed || 0 }}</p>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import TetrisBoard from '@/components/TetrisBoard.vue'
import NextPiecePreview from '@/components/NextPiecePreview.vue'
import HeldPiecePreview from '@/components/HeldPiecePreview.vue'
import type { GameStats } from '@/types/gameTypes'
import { KICK_TABLES, type KickData } from '@/utils/srs'
import {
  createEmptyBoard,
  randomTetromino,
  rotatePiece,
  BOARD_HEIGHT,
  BOARD_WIDTH
} from '@/utils/gameLogic'
import type { Piece } from '@/utils/gameLogic'

export default defineComponent({
  name: 'HomeView',
  components: {
    TetrisBoard,
    NextPiecePreview,
    HeldPiecePreview
  },
  setup() {
    const board = ref(createEmptyBoard())
    const currentPiece = ref<Piece>(randomTetromino())
    const currentPosition = ref({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 })
    const isPlaying = ref(false)
    const hasGameStarted = ref(false)
    const isGameOver = ref(false)
    const gameSpeed = ref(1000)
    const score = ref(0)
    const nextPiece = ref<Piece>(randomTetromino())
    const heldPiece = ref<Piece | null>(null)
    const canSwapHeld = ref(true)
    const level = ref(1)
    const linesCleared = ref(0)
    let gameLoop: ReturnType<typeof setInterval> | null = null
    const isGameActive = computed(() => hasGameStarted.value && !isGameOver.value)
    const finalStats = ref({
      score: 0,
      level: 1,
      linesCleared: 0
    })

    // Game stats
    const defaultGameStats: GameStats = {
      totalPiecesPlaced: 0,
      totalLinesCleared: 0,
      longestGame: 0,
      highestScore: 0,
      gamesPlayed: 0
    }

    const gameStats = ref<GameStats>({ ...defaultGameStats })

    const gameStartTime = ref(0)

    const updateGameStats = () => {
      if (!gameStats.value) {
        gameStats.value = { ...defaultGameStats }
      }
      gameStats.value.totalPiecesPlaced = (gameStats.value.totalPiecesPlaced || 0) + 1
      const currentGameTime = Math.floor((Date.now() - gameStartTime.value) / 1000)
      gameStats.value.longestGame = Math.max(gameStats.value.longestGame || 0, currentGameTime)
      gameStats.value.highestScore = Math.max(gameStats.value.highestScore || 0, score.value)
    }

    const gameBoard = computed(() => {
      const newBoard = board.value.map((row) => [...row])
      if (!isGameActive.value) return newBoard

      const ghostPosition = calculateGhostPosition()

      // Draw ghost piece
      currentPiece.value.shape.forEach((row: number[], y: number) => {
        row.forEach((cell: number, x: number) => {
          if (cell !== 0) {
            const ghostY = ghostPosition.y + y
            const ghostX = ghostPosition.x + x
            if (ghostY >= 0 && ghostY < BOARD_HEIGHT && ghostX >= 0 && ghostX < BOARD_WIDTH) {
              newBoard[ghostY][ghostX] = -1 // Use -1 to represent ghost piece
            }
          }
        })
      })

      // Draw current piece
      currentPiece.value.shape.forEach((row: number[], y: number) => {
        row.forEach((cell: number, x: number) => {
          if (cell !== 0) {
            const pieceY = currentPosition.value.y + y
            const pieceX = currentPosition.value.x + x
            if (pieceY >= 0 && pieceY < BOARD_HEIGHT && pieceX >= 0 && pieceX < BOARD_WIDTH) {
              newBoard[pieceY][pieceX] = cell
            }
          }
        })
      })

      return newBoard
    })

    const findHighestValidPosition = (piece: Piece) => {
      let y = 0
      const maxAttempts = BOARD_HEIGHT + piece.shape.length // Prevent infinite loop
      let attempts = 0
      while (
        attempts < maxAttempts &&
        !isValidMove({ x: Math.floor(BOARD_WIDTH / 2) - 1, y }, piece.shape)
      ) {
        y--
        attempts++
      }
      return y
    }

    const movePiece = (direction: 'left' | 'right' | 'down') => {
      const newPosition = { ...currentPosition.value }
      switch (direction) {
        case 'left':
          newPosition.x -= 1
          break
        case 'right':
          newPosition.x += 1
          break
        case 'down':
          moveDown()
          return
      }
      if (isValidMove(newPosition)) currentPosition.value = newPosition
    }

    const calculateGameSpeed = (currentLevel: number) => {
      // Decrease game speed by 50ms for each level, with a minimum of 100ms
      return Math.max(1000 - (currentLevel - 1) * 50, 100)
    }

    const calculateGhostPosition = () => {
      const ghostPosition = { ...currentPosition.value }
      while (
        ghostPosition.y < BOARD_HEIGHT &&
        isValidMove({ ...ghostPosition, y: ghostPosition.y + 1 }, currentPiece.value.shape)
      ) {
        ghostPosition.y++
      }
      return ghostPosition
    }

    const rotate = (direction: 1 | -1 = 1) => {
      const rotatedPiece = rotatePiece(currentPiece.value, direction)
      const kickTable = currentPiece.value.shape.length === 4 ? KICK_TABLES.I : KICK_TABLES.JLSTZ
      const tests = kickTable[currentPiece.value.rotationState]

      for (const [testX, testY] of tests) {
        const newPosition = {
          x: currentPosition.value.x + testX,
          y: currentPosition.value.y - testY // Subtract Y because Tetris coordinate system is inverted
        }
        if (isValidMove(newPosition, rotatedPiece.shape)) {
          currentPiece.value = rotatedPiece
          currentPosition.value = newPosition
          return
        }
      }
    }

    const moveDown = () => {
      if (isValidMove({ ...currentPosition.value, y: currentPosition.value.y + 1 })) {
        currentPosition.value.y++
      } else {
        lockPiece()
        if (checkGameOver()) {
          endGame()
        }
      }
    }

    const lockPiece = () => {
      currentPiece.value.shape.forEach((row: number[], y: number) => {
        row.forEach((cell: number, x: number) => {
          if (cell !== 0) {
            const boardY = currentPosition.value.y + y
            const boardX = currentPosition.value.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT) {
              board.value[boardY][boardX] = cell
            }
          }
        })
      })

      canSwapHeld.value = true
      clearLines()
      updateGameStats()

      if (checkGameOver()) {
        endGame()
        return
      }

      // Spawn new piece
      currentPiece.value = nextPiece.value
      nextPiece.value = randomTetromino()
      const spawnY = findHighestValidPosition(currentPiece.value)
      currentPosition.value = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: spawnY }

      // Check if the new piece can be placed
      if (!isValidMove(currentPosition.value)) {
        endGame()
      }
    }

    const checkGameOver = () => {
      // Check if any cell in the top row is filled
      return board.value[0].some((cell) => cell !== 0)
    }

    const holdPiece = () => {
      if (!canSwapHeld.value) return

      if (heldPiece.value === null) {
        heldPiece.value = currentPiece.value
        currentPiece.value = nextPiece.value
        nextPiece.value = randomTetromino()
      } else {
        const temp = currentPiece.value
        currentPiece.value = heldPiece.value
        heldPiece.value = temp
      }
      currentPosition.value = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
      canSwapHeld.value = false
    }

    const hardDrop = () => {
      while (
        isValidMove(
          { ...currentPosition.value, y: currentPosition.value.y + 1 },
          currentPiece.value.shape
        )
      ) {
        currentPosition.value.y++
      }
      lockPiece()
    }

    const clearLines = () => {
      let linesCleared = 0

      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board.value[y].every((cell) => cell !== 0)) {
          // Remove line
          board.value.splice(y, 1)
          // Add new empty line at the top
          board.value.unshift(Array(BOARD_WIDTH).fill(0))
          linesCleared++
          y++
        }
      }

      // Update score
      if (linesCleared > 0) {
        updateScore(linesCleared)
      }
      gameStats.value.totalLinesCleared = (gameStats.value.totalLinesCleared || 0) + linesCleared
    }

    const updateScore = (clearedLines: number) => {
      // 100 points per line, with bonuses for multiple lines
      const points = [0, 100, 300, 500, 800]
      score.value += points[clearedLines] * level.value
      linesCleared.value += clearedLines

      // Increase level every 10 lines cleared
      if (linesCleared.value >= level.value * 10) {
        level.value++

        // Increase game speed
        if (gameLoop) {
          clearInterval(gameLoop)
          gameSpeed.value = calculateGameSpeed(level.value)
          gameLoop = setInterval(moveDown, gameSpeed.value)
        }
      }
    }

    const startGame = () => {
      resetGame()
      isPlaying.value = true
      hasGameStarted.value = true
      gameStartTime.value = Date.now()
      gameStats.value.gamesPlayed++

      if (gameLoop) {
        clearInterval(gameLoop)
        gameLoop = null
      }
      gameLoop = setInterval(moveDown, gameSpeed.value)
    }

    const pauseGame = () => {
      if (isPlaying.value && !isGameOver.value) {
        isPlaying.value = false
        if (gameLoop) {
          clearInterval(gameLoop)
          gameLoop = null
        }
      }
    }

    const resumeGame = () => {
      if (hasGameStarted.value && !isPlaying.value && !isGameOver.value) {
        isPlaying.value = true
        gameLoop = setInterval(moveDown, gameSpeed.value)
      }
    }

    const resetGame = () => {
      pauseGame()
      score.value = 0
      level.value = 1
      linesCleared.value = 0
      board.value = createEmptyBoard()
      currentPiece.value = randomTetromino()
      nextPiece.value = randomTetromino()
      heldPiece.value = null
      canSwapHeld.value = true
      currentPosition.value = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
      hasGameStarted.value = false
      isGameOver.value = false
      isPlaying.value = false
      gameSpeed.value = calculateGameSpeed(1) // Reset game speed to level 1

      finalStats.value = {
        score: 0,
        level: 1,
        linesCleared: 0
      }
    }

    const endGame = () => {
      isPlaying.value = false
      isGameOver.value = true
      if (gameLoop) {
        clearInterval(gameLoop)
        gameLoop = null
      }
      updateGameStats()

      finalStats.value = {
        score: score.value,
        level: level.value,
        linesCleared: linesCleared.value
      }
    }

    const handleGameControl = () => {
      if (!hasGameStarted.value || isGameOver.value) {
        startGame()
      } else if (isPlaying.value) {
        pauseGame()
      } else {
        resumeGame()
      }

      // Remove focus from the button
      ;(document.activeElement as HTMLElement).blur()
    }

    const gameControlButtonText = computed(() => {
      if (!hasGameStarted.value || isGameOver.value) return 'Start Game'
      return isPlaying.value ? 'Pause' : 'Resume'
    })

    const isValidMove = (
      position: { x: number; y: number },
      shape: number[][] = currentPiece.value.shape
    ) => {
      return shape.every((row: number[], y: number) => {
        return row.every((cell: number, x: number) => {
          if (cell === 0) return true
          const newX = position.x + x
          const newY = position.y + y
          if (newX < 0 || newX >= BOARD_WIDTH) return false
          if (newY >= BOARD_HEIGHT) return false
          if (newY < 0) return true // Allow pieces to be partially above the board
          return board.value[newY][newX] === 0
        })
      })
    }

    const handleKeydown = (event: KeyboardEvent) => {
      // Prevent default behavior for these keys
      if (event.key === ' ') {
        event.preventDefault()
      }
      // These controls should work even if the game is not active
      if (event.key === 'p' || event.key === 'P') {
        if (hasGameStarted.value && !isGameOver.value) {
          isPlaying.value ? pauseGame() : resumeGame()
        }
        return
      }
      if (event.key === 'r' || event.key === 'R') {
        resetGame()
        return
      }

      // These controls should only work if the game is active
      if (!isPlaying.value) return

      switch (event.key) {
        case 'ArrowLeft':
          movePiece('left')
          break
        case 'ArrowRight':
          movePiece('right')
          break
        case 'ArrowDown':
          movePiece('down')
          break
        case 'ArrowUp':
          rotate(1) // Clockwise rotation
          break
        case 'z':
        case 'Z':
          rotate(-1) // Counter-clockwise rotation
          break
        case ' ':
          hardDrop()
          break
        case 'Shift':
          holdPiece()
          break
      }
    }

    const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return '0:00'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const saveGameStats = (stats: GameStats) => {
      localStorage.setItem('tetrisGameStats', JSON.stringify(stats))
    }

    const loadGameStats = () => {
      const savedStats = localStorage.getItem('tetrisGameStats')
      if (savedStats) {
        try {
          const parsedStats = JSON.parse(savedStats)
          gameStats.value = {
            totalPiecesPlaced: parsedStats.totalPiecesPlaced || 0,
            totalLinesCleared: parsedStats.totalLinesCleared || 0,
            longestGame: parsedStats.longestGame || 0,
            highestScore: parsedStats.highestScore || 0,
            gamesPlayed: parsedStats.gamesPlayed || 0
          }
        } catch (error) {
          console.error('Error parsing saved game stats:', error)
          gameStats.value = { ...defaultGameStats }
        }
      } else {
        gameStats.value = { ...defaultGameStats }
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
      loadGameStats()
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      if (gameLoop) clearInterval(gameLoop)
      saveGameStats(gameStats.value)
    })

    return {
      gameBoard,
      handleGameControl,
      resetGame,
      gameControlButtonText,
      hasGameStarted,
      score,
      finalStats,
      isGameOver,
      nextPiece,
      level,
      linesCleared,
      heldPiece,
      gameStats,
      formatTime,
      isGameActive
    }
  }
})
</script>

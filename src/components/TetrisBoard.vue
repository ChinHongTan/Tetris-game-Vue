<template>
  <div class="tetris-board">
    <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
      <v-sheet
        v-for="(cell, cellIndex) in row"
        :key="cellIndex"
        class="cell"
        :color="cell !== 0 ? 'primary' : 'grey-lighten-3'"
        elevation="0"
      ></v-sheet>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'TetrisBoard',
  props: {
    board: {
      type: Array as PropType<number[][]>,
      required: true
    }
  }
})
</script>

<style scoped>
.tetris-board {
  display: inline-block;
  border: 2px solid #333;
}
.board-row {
  display: flex;
}
.cell {
  width: 25px;
  height: 25px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}
</style>

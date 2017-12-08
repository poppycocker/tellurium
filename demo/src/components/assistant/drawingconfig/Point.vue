<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="10">アイコン倍率</el-col>
        <el-col :span="14">
          <el-slider :min="0.5" :max="5.0" :step="0.5" v-model="styleProps.imageScale" @change="raiseChange" show-stops show-input />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">不透明度</el-col>
        <el-col :span="14">
          <el-slider :min="0.0" :max="1.0" :step="0.1" v-model="styleProps.imageOpacity" @change="raiseChange" show-stops show-input />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">回転角(°)</el-col>
        <el-col :span="14">
          <el-slider :min="0" :max="360" :step="5" v-model="styleProps.imageRotation" @change="raiseChange" show-stops show-input />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">回転固定</el-col>
        <el-col :span="14">
          <el-checkbox v-model="styleProps.imageRotateWithView" @change="raiseChange" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">ラベル文字列</el-col>
        <el-col :span="14">
          <el-input v-model="styleProps.text" @change="raiseChange" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">フォント</el-col>
        <el-col :span="14">
          <el-input v-model="styleProps.font" @change="raiseChange" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">文字色</el-col>
        <el-col :span="14">
          <el-color-picker v-model="styleProps.fontFillColor" @change="raiseChange" show-alpha />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">縁取り色</el-col>
        <el-col :span="14">
          <el-color-picker v-model="styleProps.fontStrokeColor" @change="raiseChange" show-alpha />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">縁取り幅</el-col>
        <el-col :span="14">
          <el-slider :min="1" :max="10" :step="1" v-model="styleProps.fontStrokeWidth" @change="raiseChange" show-stops show-input />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">揃え位置</el-col>
        <el-col :span="14">
          <el-select v-model="styleProps.textAlign" @change="raiseChange">
            <el-option v-for="textAlign in textAlignOptions" :key="textAlign" :label="textAlign" :value="textAlign" />
          </el-select>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10">基準位置</el-col>
        <el-col :span="14">
          <el-select v-model="styleProps.textBaseline" @change="raiseChange">
            <el-option v-for="textBaseline in textBaselineOptions" :key="textBaseline" :label="textBaseline" :value="textBaseline" />
          </el-select>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="18">
          <ul class="markers">
            <li v-for="marker in markers" v-bind:class="{ selectedmarker: marker === styleProps.imageSrc }"><img :src="marker" @click="onImageClicked"></li>
          </ul>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'
import markers from '@/assets/markers'

export default {
  props: ['styleProps'],
  data() {
    return {
      markers,
      textAlignOptions: ['left', 'center', 'right'],
      textBaselineOptions: ['bottom', 'middle', 'top']
    }
  },
  mounted() {
    this.raiseChange()
  },
  methods: {
    onImageClicked(e) {
      this.styleProps.imageSrc = e.target.src
      this.raiseChange()
    },
    raiseChange() {
      hub.$emit('drawing_style_changed', this.styleProps)
    }
  }
}
</script>

<style scoped>
.markers {
  max-width: 16em;
}
.markers li {
  list-style-type: none;
  float: left;
}
img {
  fill: blue;
}
img:hover {
  cursor: pointer;
}
.selectedmarker {
  background-color: #409eff;
}
</style>

const AudioContext = window.AudioContext || window.webkitAudioContext

type CalcFunction = (
  bin: Uint8Array | Float32Array,
  sampleRate: number,
  minHz: number | undefined,
  maxHz: number | undefined
) => number

const averageFreqData: CalcFunction = (
  bin: Uint8Array | Float32Array,
  sampleRate: number,
  minHz: number | undefined,
  maxHz: number | undefined
) => {
  let sum = 0
  let n = 0

  const binCount = bin.length
  for (let i = 0; i < binCount; i++) {
    const hz = (i * sampleRate) / binCount
    if (minHz !== undefined && hz < minHz) {
      continue
    }
    if (maxHz !== undefined && hz > maxHz) {
      continue
    }
    sum += bin[i]
    n++
  }

  const average = sum / n
  return average
}

const maxFreqData: CalcFunction = (
  bin: Uint8Array | Float32Array,
  sampleRate: number,
  minHz: number | undefined,
  maxHz: number | undefined
) => {
  let maxVal = -Infinity

  const binCount = bin.length
  for (let i = 0; i < binCount; i++) {
    if (maxVal < bin[i]) {
      const hz = (i * sampleRate) / binCount
      if (minHz !== undefined && hz < minHz) {
        continue
      }
      if (maxHz !== undefined && hz > maxHz) {
        continue
      }
      maxVal = bin[i]
    }
  }

  return maxVal
}

interface WatchStreamAudioLevelOption {
  minHz?: number
  maxHz?: number
  calcMethod?: 'average' | 'max'
  valueType?: 'byte' | 'float'
}

export const watchStreamAudioLevel = (
  stream: MediaStream,
  onUpdate: (v: number) => void,
  opt?: WatchStreamAudioLevelOption
): (() => void) => {
  const calcMethod = opt && opt.calcMethod ? opt.calcMethod : 'average'
  const valueType = opt && opt.valueType ? opt.valueType : 'byte'

  const audioContext = new AudioContext()
  const analyser = audioContext.createAnalyser()
  const mediaStreamSource = audioContext.createMediaStreamSource(stream)
  const processor = audioContext.createScriptProcessor(2048, 1, 1)

  analyser.smoothingTimeConstant = 0.1
  analyser.fftSize = 512

  mediaStreamSource.connect(analyser)
  analyser.connect(processor)
  processor.connect(audioContext.destination)

  const calcF = calcMethod === 'average' ? averageFreqData : maxFreqData

  const getFreqData = () => {
    if (valueType === 'byte') {
      const bin = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(bin)
      return bin
    }
    const bin = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(bin)
    return bin
  }

  const handler = () => {
    const bin = getFreqData()

    const v = calcF(
      bin,
      audioContext.sampleRate,
      opt && opt.minHz,
      opt && opt.maxHz
    )

    onUpdate(v)
  }
  processor.onaudioprocess = handler

  return () => {
    processor.removeEventListener('audioprocess', handler)
    analyser.disconnect(processor)
    processor.disconnect(audioContext.destination)
    mediaStreamSource.disconnect(analyser)
    audioContext.close()
  }
}

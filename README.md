# stream-audio-level

a module to get MediaStream audio level.

## Installation

```
yarn add stream-audio-level
```

## Usage

### Mininum

```ts
import { watchStreamAudioLevel } from 'stream-audio-level'

const close = watchStreamAudioLevel(stream, (v) => console.log(v))
close()
```

### With option

```ts
import { watchStreamAudioLevel } from 'stream-audio-level'

const close = watchStreamAudioLevel(stream, (v) => console.log(v), {
    minHz: 100, 
    maxHz: 1000,
    calcMethod: 'max', // default 'average'
    valueType: 'float' // default 'byte'
})
close()
```

const LEVELS = [4, 5, 6]

type Data = {
  label: string
  value: string
  disabled?: boolean
  children: Data[]
}

function getDemoData() {
  function generateData(level: number, prefixPath: string) {
    const result: Data[] = []

    for (let i = 0; i < LEVELS[level]; i++) {
      const path = prefixPath ? `${prefixPath}-${i + 1}` : `${i + 1}`
      const temp: Data = {
        label: path,
        value: `${path}`,
        children: generateData(level + 1, path)
      }
      result.push(temp)
    }

    return result
  }

  const result = generateData(0, '')
  return result
}


export function getDisableDemoData() {
  const DISABLE_KEYS = ['1-1-1', '1-3-4', '3-2-3', '3-3-2', '3-3', '4-1']
  function generateData(level: number, prefixPath: string) {
    const result: Data[] = []

    for (let i = 0; i < LEVELS[level]; i++) {
      const path = prefixPath ? `${prefixPath}-${i + 1}` : `${i + 1}`
      const temp: Data = {
        label: path,
        value: `${path}`,
        disabled: DISABLE_KEYS.includes(path),
        children: generateData(level + 1, path)
      }
      result.push(temp)
    }

    return result
  }

  const result = generateData(0, '')
  return result
}

const more = [4, 5, 6, 1, 2, 3, 4, 50]
export function getMoreData() {
  function generateData(level: number, prefixPath: string) {
    const result: Data[] = []

    for (let i = 0; i < more[level]; i++) {
      const path = prefixPath ? `${prefixPath}-${i + 1}` : `${i + 1}`
      const temp: Data = {
        label: path,
        value: `${path}`,
        children: generateData(level + 1, path)
      }
      result.push(temp)
    }

    return result
  }

  const result = generateData(0, '')
  return result
}

export default getDemoData()
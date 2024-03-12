import React from 'react'
import Modules from '../module/module'
import data from './demo'

const Demo = () => {
  const tree = data
  return (
    <Modules tree={tree} />
  )
}

export default Demo
import React from 'react'
import Modules from '../module/module'
import { getDisableDemoData } from '../demo/demo'

const disableData = getDisableDemoData()

const DisableDemo = () => {
  return (
    <Modules tree={disableData} value={{
      checkedKeys: ['4-1'],
      halfCheckedKeys: []
   
    }}  />
  )
}

export default DisableDemo
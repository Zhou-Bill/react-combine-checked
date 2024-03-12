
import React from 'react'
import { Checkbox } from 'antd'
import classNames from 'classnames'
import useTreeLink  from '../useTreeLink'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { TreeType } from '../useTreeLink'
import './index.less'

type OptionType = TreeType

interface ModulesProps {
  tree?: OptionType[]
  value?: {
    checkedKeys: Array<number | string>
    halfCheckedKeys: Array<number | string>
  }
  onChange?: (value: {
    checkedKeys: Array<number | string>
    halfCheckedKeys: Array<number | string>
  }) => void
}

const Modules = (props: ModulesProps) => {
  const { tree } = props
  const { treeLink, checkedKeys, isCheckAll, halfCheckedKeys, checkAllIsIndeterminate, onInnerCheckedChange, onCheckAllChange } =
    useTreeLink({
      tree: tree || [],
      value: props.value,
      onChange: props.onChange,
    })

  console.log(checkAllIsIndeterminate, isCheckAll)

  const handleCheckChange = (e: CheckboxChangeEvent, record: OptionType) => {
    const node = treeLink[record.value]
    const isChecked = e.target.checked

    const data = {
      checked: isChecked,
      node: node,
    }
    onInnerCheckedChange(data)
  }

  const renderChildren = (modules: OptionType[], floor: number) => {
    if (!modules || modules.length === 0) {
      return null
    }
    return (
      <div className={classNames('content', `content-floor-${floor}`)}>
        {modules?.map((_moduleChild) => {
          return (
            <div
              className={classNames(
                'content-item',
                `content-item-floor-${floor}`,
              )}
              key={_moduleChild.value}
            >
              <Checkbox
                disabled={_moduleChild.disabled}
                indeterminate={
                  halfCheckedKeys.includes(_moduleChild.value) &&
                  !checkedKeys.includes(_moduleChild.value)
                }
                checked={checkedKeys.includes(_moduleChild.value)}
                onChange={(e) => handleCheckChange(e, _moduleChild)}
                className={classNames(`content-item-floor-${floor}-label`)}
              >
                {_moduleChild.label}
              </Checkbox>
              <div className='content-item-child'>
                {renderChildren(_moduleChild.children || [], floor + 1)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <Checkbox
        style={{ marginBottom: 12 }}
        indeterminate={checkAllIsIndeterminate}
        checked={isCheckAll}
        onChange={onCheckAllChange}
      >
        全选
      </Checkbox>
      {
        tree?.map((_module) => {
          return (
            <div className='module-section-item' key={_module.value}>
              <div className='header'>
                <Checkbox
                  disabled={_module.disabled}
                  indeterminate={
                    halfCheckedKeys.includes(_module.value) &&
                    !checkedKeys.includes(_module.value)
                  }
                  checked={checkedKeys.includes(_module.value)}
                  onChange={(e) => handleCheckChange(e, _module)}
                >
                  {_module.label}
                </Checkbox>
              </div>
              <div className='content-item-child-first'>
                {renderChildren(_module.children || [], 0)}
              </div>
            </div>
          )
        })
      }
    </div>
  )
}

export default Modules

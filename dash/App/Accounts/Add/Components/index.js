import React from 'react'
import { useState } from 'react'

import RingIcon from '../../../../../resources/Components/RingIcon'
import { ConfirmPassword, CreatePassword } from '../../../../../resources/Components/Password'
import link from '../../../../../resources/link'

const navForward = async (newAccountType, accountData) =>
  link.send('nav:forward', 'dash', {
    view: 'accounts',
    data: {
      showAddAccounts: true,
      newAccountType,
      accountData
    }
  })

const removeLineBreaks = (str) => str.replace(/(\r\n|\n|\r)/gm, '')

const AddHotAccountWrapper = ({ children, title, svgName, summary, intro, index }) => {
  return (
    <div className={'addAccountItem addAccountItemSmart addAccountItemAdding'}>
      <div className='addAccountItemBar addAccountItemHot' />
      <div className='addAccountItemWrap'>
        <div className='addAccountItemTop'>
          <div className='addAccountItemTopType'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconHot'>
                <RingIcon {...{ svgName }} />
              </div>
              <div className='addAccountItemIconHex addAccountItemIconHexHot' />
            </div>
            <div className='addAccountItemTopTitle'>{title}</div>
          </div>
          <div className='addAccountItemSummary'>{summary}</div>
        </div>
        <div className='addAccountItemOption'>
          <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * index}%)` }}>
            <div className='addAccountItemOptionSetupFrames'>{children}</div>
          </div>
        </div>
        <div className='addAccountItemFooter' />
      </div>
    </div>
  )
}

const EnterSecret = ({ newAccountType, isValidSecret, title }) => {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState(null)

  const updateInput = (e) => {
    const value = removeLineBreaks(e.target.value)
    setSecret(value)
  }

  const handleSubmit = (e) => {
    if (e.type !== 'mousedown' && e.key !== 'Enter') {
      return
    }

    if (!isValidSecret(secret)) {
      return setError(`INVALID ${title.toUpperCase()}`)
    }

    return navForward(newAccountType, {
      secret
    })
  }

  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div data-testid='addHotAccountSecretTitle' className='addAccountItemOptionTitle'>
        {title}
      </div>
      {error && (
        <div data-testid='addHotAccountSecretError' style={{ color: 'red' }}>
          {error}
        </div>
      )}
      <div className='addAccountItemOptionInputPhrase'>
        <textarea
          data-testid='addHotAccountSecretTextEntry'
          tabIndex='-1'
          value={secret}
          onChange={updateInput}
          onKeyDown={handleSubmit}
        />
      </div>
      <div
        data-testid='addHotAccountSecretSubmitButton'
        className='addAccountItemOptionSubmit'
        onMouseDown={handleSubmit}
      >
        Next
      </div>
    </div>
  )
}

const Error = ({ err }) => {
  return (
    <div className='addAccountItemOptionSetupFrame'>
      <>
        <div className='addAccountItemOptionTitle'>{err}</div>
        <div
          role='button'
          className='addAccountItemOptionSubmit'
          onClick={() => link.send('nav:back', 'dash', 3)}
        >
          try again
        </div>
      </>
    </div>
  )
}

export function AddHotAccount({
  title,
  summary,
  svgName,
  intro,
  accountData,
  createSignerMethod,
  newAccountType,
  isValidSecret
}) {
  const { secret, password, err } = accountData
  const viewIndex = err ? 3 : !secret ? 0 : !password ? 1 : 2

  const onCreate = (secret) => (password) =>
    navForward(newAccountType, {
      secret,
      password
    })

  const onConfirm = (secret) => (password) =>
    link.rpc(createSignerMethod, secret, password, (err, signer) => {
      if (err) {
        return navForward(newAccountType, {
          error: err
        })
      }

      link.send('nav:back', 'dash', 4)
      link.send(`nav:forward`, 'dash', {
        view: 'expandedSigner',
        data: { signer: signer.id }
      })
    })

  const steps = [
    <EnterSecret key={0} {...{ isValidSecret, title, newAccountType }} />,
    <CreatePassword key={1} onCreate={onCreate(secret)} />,
    <ConfirmPassword key={2} password={password} onConfirm={onConfirm(secret)} />,
    <Error key={3} {...{ err }} />
  ]

  return (
    <AddHotAccountWrapper
      {...{
        title,
        intro,
        summary,
        svgName,
        index: viewIndex
      }}
    >
      {steps}
    </AddHotAccountWrapper>
  )
}

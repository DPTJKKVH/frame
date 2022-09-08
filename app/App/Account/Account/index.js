import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

import Default from './Default'

import Activity from './Activity'
import Balances from './Balances'
import Gas from '../../../../resources/Components/Gas'
import Inventory from './Inventory'
import Launcher from './Launcher'
import Permissions from './Permissions'
import Requests from './Requests'
import Settings from './Settings'
import SignerStatus from './SignerStatus'

// move 
import ProviderRequest from './Requests/ProviderRequest'
import TransactionRequest from './Requests/TransactionRequest'
import SignatureRequest from './Requests/SignatureRequest'
import ChainRequest from './Requests/ChainRequest'
import AddTokenRequest from './Requests/AddTokenRequest'
import SignTypedDataRequest from './Requests/SignTypedDataRequest'

class _AccountModule extends React.Component {
  render () {
    const { 
      id, 
      module, 
      top, 
      index,
      expanded, 
      expandedData,
      account
    } = this.props
    let hidden = false
    let style = { 
      transform: `translateY(${top}px)`, 
      zIndex: 10000 - index, 
      height: module.height,
      opacity: 1
    }
    //  && !this.props.signer) hidden = true
    if (hidden) {
      style = { 
        transform: `translateY(${top}px)`, 
        zIndex: 10000 - index, 
        height: 0,
        opacity: 0,
        overflow: 'hidden'
      }
    }

    return (
      <div className={'accountModule'} style={style}>
        <div className='accountModuleInner cardShow' style={{ animationDelay: (index * 0.1) + 's'}}>
          {
            id === 'gas' ? <Gas 
              moduleId={id} 
              id={account}
              expanded={expanded}
            /> :
            id === 'requests' ? <Requests 
              _id={id}
              id={account}
              addresses={this.props.addresses} 
              minimized={this.props.minimized} 
              status={this.props.status} 
              signer={this.props.signer}
              expanded={expanded}
            /> :
            id === 'activity' ? <Activity 
              moduleId={id} 
              id={account}
              expanded={expanded}
            /> :
            id === 'launcher' ? <Launcher 
              moduleId={id}
              id={account} 
              expanded={expanded}
            /> :
            id === 'inventory' ? <Inventory 
              moduleId={id} 
              account={account}
              expanded={expanded}
              expandedData={expandedData}
            /> :
            id === 'permissions' ? <Permissions
              moduleId={id}
              account={account}
              expanded={expanded}
            /> :
            id === 'balances' ? <Balances
              moduleId={id}
              account={account}
              expanded={expanded}
            /> :
            id === 'settings' ? <Settings
              moduleId={id}
              account={account}
              expanded={expanded}
            /> :
            <Default 
              moduleId={id}
              expanded={expanded}
            />
          }
        </div>  
      </div>
    )
  }
}

const AccountModule = Restore.connect(_AccountModule)

// account module is position absolute and with a translateX 
class _AccountMain extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expandedModule: ''
    }
  }
  // computePositions () {
  //   this.resizeObserver.disconnect()
  //   const modulePositions = []
  //   let slideHeight = 0
  //   this.moduleRefs.forEach((ref, i) => {
  //     modulePositions[i] = {}
  //     modulePositions[i].top = slideHeight
  //     modulePositions[i].height = ref && ref.current ? ref.current.clientHeight + 1 : 0
  //     slideHeight += modulePositions[i].height
  //   })
  // }
  

  setSignerStatusOpen (value) {
    link.send('tray:action', 'setAccountSignerStatusOpen', value)
  }
  
  renderSignerStatus () {
    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = current && this.store('selected.open')

    const signerStatusOpen = current && this.store('selected.signerStatusOpen')

    const account = this.store('main.accounts', this.props.id)
    let signer

    if (account.signer) {
      signer = this.store('main.signers', account.signer)
    } else if (account.smart)  {
      const actingSigner = this.store('main.accounts', account.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }
    if (!signerStatusOpen || !open) return null
    return (
      <SignerStatus 
        open={open}
        signer={signer}
        setSignerStatusOpen={this.setSignerStatusOpen}
      />
    )
  }

  renderAccountFilter () {
    const accountOpen = this.store('selected.open')
    return (
      <div className='panelFilter'>
        <div className='panelFilterIcon'>
          {svg.search(12)}
        </div>
        <div className='panelFilterInput'>
          <input 
            tabIndex='-1'
            onChange={(e) => {
              const value = e.target.value
              this.setState({ accountFilter: value  })
              link.send('tray:action', 'setAccountFilter', value)
            }}
            value={this.state.accountFilter}
          />
        </div>
        {this.state.accountFilter ? (
          <div 
            className='panelFilterClear'
            onClick={() => {
              this.setState({ accountFilter: '' })
              link.send('tray:action', 'setAccountFilter', '')
            }}
          >
            {svg.close(12)}
          </div>
        ) : null}
      </div>
    )
  }

  render () {
    const accountModules = this.store('panel.account.modules')
    const accountModuleOrder = this.store('panel.account.moduleOrder')
    let slideHeight = 0
    const modules = accountModuleOrder.map((id, i) => {
      const module = accountModules[id] || { height: 0 }
      slideHeight += module.height + 7
      return <AccountModule
        key={id}
        id={id} 
        account={this.props.id}
        module={module} 
        top={slideHeight - module.height + 40}
        index={i}
      />
    })
    return (
      <div className='accountMain'>
        {this.renderAccountFilter()}
        {this.renderSignerStatus()}
        <div className='accountMainScroll' style={{ pointerEvents: this.state.expandedModule ? 'none' : 'auto' }}>
          <div className='accountMainSlide' style={{ height: slideHeight + 'px' }}>
            {modules}
          </div>
        </div>
      </div>
    )
  }
}

const AccountMain = Restore.connect(_AccountMain)


// AccountView is a reusable template that provides the option to nav back to main
class _AccountView extends React.Component {
  render () {
    return (
      <div className='accountView'
        // TODO: sync via nav
        style={{
          bottom: '200px'
        }}
      >
        <div className='accountViewMenu cardShow'>
          <div 
            className='accountViewBack'
            onClick={() => this.props.back()}
          >
            {svg.chevronLeft(13)}
          </div>
          <div className='accountViewTitle'>
            <div className='accountViewIcon'>
              {this.props.accountViewIcon}
            </div>
            <div className='accountViewText'>
              {this.props.accountViewTitle}
            </div>
          </div>
        </div>
        <div className='accountViewMain cardShow'>
          {this.props.children}
        </div>
      </div>
    )
  }
}

const AccountView = Restore.connect(_AccountView)

function isHardwareSigner (account = {}) {
  return ['ledger', 'lattice', 'trezor'].includes(account.lastSignerType)
}


class _AccountBody extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      view: 'request'
    }
  } 
  renderRequest (req, data) {
    const activeAccount =  this.store('main.accounts', this.props.id)
    const signingDelay = isHardwareSigner(activeAccount) ? 200 : 1500

    if (req.type === 'transaction') {
      return (
        <TransactionRequest 
          key={req.handlerId}
          req={req}
          step={data.step}
          handlerId={req.handlerId}
          accountId={this.props.id}
          signingDelay={signingDelay}
        />
      )
    } else if (req.type === 'access') {
      return (
        <ProviderRequest 
          key={req.handlerId} 
          handlerId={req.handlerId}
          accountId={this.props.id}
          req={req} 
        />
      )
    } else if (req.type === 'sign') {
      return (
        <SignatureRequest 
          key={req.handlerId} 
          req={req} 
          handlerId={req.handlerId}
          accountId={this.props.id}
          signingDelay={signingDelay} 
        />
      )
    } else if (req.type === 'signTypedData') {
      return (
        <SignTypedDataRequest
          key={req.handlerId}
          req={req}
          handlerId={req.handlerId}
          accountId={this.props.id}
          signingDelay={signingDelay}
        />
      )
    } else if (req.type === 'addChain' || req.type === 'switchChain') {
      return (
        <ChainRequest 
          key={req.handlerId} 
          req={req} 
          handlerId={req.handlerId}
          accountId={this.props.id}
        />
      )
    } else if (req.type === 'addToken') {
      return (
        <AddTokenRequest
          key={req.handlerId}
          req={req} 
          handlerId={req.handlerId}
          accountId={this.props.id}
        />
      )
    } else {
      return null
    }
  }
  render () {
    const crumb = this.store('windows.panel.nav')[0] || {}

    if (crumb.view === 'requestView') {
      const { accountId, requestId } = crumb.data
      const req = this.store('main.accounts', accountId, 'requests', requestId)
      let accountViewTitle, accountViewIcon
      if (req.type === 'access') {
        accountViewTitle = 'Account Access'
        // accountViewIcon = svg.accounts(17)
      } else if (req.type === 'sign') {
        accountViewTitle = 'Sign Message'
        // accountViewIcon = svg.sign(17)
      } else if (req.type === 'signTypedData') {
        accountViewTitle = 'Sign Data'
        // accountViewIcon = svg.sign(17)
      } else if (req.type === 'addChain') { 
        accountViewTitle = 'Add Chain'
        // accountViewIcon = svg.chain(17)
      } else if (req.type === 'switchChain') {
        accountViewTitle = 'Switch Chain'
        // accountViewIcon = svg.chain(17)
      } else if (req.type === 'addToken')  {
        accountViewTitle = 'Add Token'
        // accountViewIcon = svg.tokens(17)
      } else if (req.type === 'transaction')  {
        accountViewTitle = 'Sign Transaction'
        // accountViewIcon = svg.broadcast(17)
      }
      return (
        <AccountView 
          back={() => {
            link.send('nav:back', 'panel')
          }}
          {...this.props}
          accountViewTitle={accountViewTitle}
          accountViewIcon={accountViewIcon}
        >
          {this.renderRequest(req, crumb.data)}
        </AccountView>
      )
    } else if (crumb.view === 'expandedModule') {
      return (
        <AccountView 
          back={() => {
            link.send('nav:back', 'panel')
          }}
          {...this.props}
          accountViewTitle={crumb.data.id}
        >
          <div 
            className='accountsModuleExpand cardShow' 
            onMouseDown={() => this.setState({ expandedModule: false })}
          >
            <div className='moduleExpanded' onMouseDown={(e) => {
              e.stopPropagation()
            }}>
              <AccountModule 
                id={crumb.data.id}
                account={crumb.data.account}
                module={{ height: 'auto' }}
                top={0}
                index={0}
                expanded={true} 
                expandedData={crumb.data}
              />
            </div>
          </div>
        </AccountView>
      )
    } else {
      return (
        <AccountMain {...this.props} />
      )
    }
  }
}


const AccountBody = Restore.connect(_AccountBody)

class Account extends React.Component {
  render () {
    const minimized = this.store('selected.minimized')

    const account = this.store('main.accounts', this.props.id)
    let signer

    if (account.signer) {
      signer = this.store('main.signers', account.signer)
    } else if (account.smart)  {
      const actingSigner = this.store('main.accounts', account.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }

    return (
      <AccountBody
        id={this.props.id} 
        addresses={this.props.addresses} 
        minimized={minimized} 
        status={this.props.status} 
        signer={this.props.signer} 
      />   
    )
  }
}

export default Restore.connect(Account)

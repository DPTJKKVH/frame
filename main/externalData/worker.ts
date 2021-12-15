import log from 'electron-log'

import ethProvider from 'eth-provider'

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'
log.transports.console.level = process.env.LOG_WORKER ? 'debug' : 'info'

import { supportsChain as chainSupportsScan } from '../multicall'
import balancesLoader, { BalanceLoader } from './balances'
import tokenLoader from './inventory/tokens'
import rates from './rates'
import inventory from './inventory'
import loadStaticData from './staticData'

interface ExternalDataWorkerMessage {
  command: string,
  args: any[]
}

let heartbeat: NodeJS.Timeout
let balances: BalanceLoader
let chainId = 0

const eth = ethProvider('frame', { name: 'scanWorker' })

eth.on('chainChanged', chain => chainId = parseInt(chain))
eth.on('connect', async () => {
  chainId = parseInt(await eth.request({ method: 'eth_chainId' }))

  tokenLoader.start()
  balances = balancesLoader(eth)

  sendToMainProcess({ type: 'ready' })
})

async function getChains () {
  try {
    const chains: string[] = await eth.request({ method: 'wallet_getChains' })
    return chains.map(chain => parseInt(chain))
  } catch (e) {
    log.error('could not load chains', e)
    return []
  }
}

function sendToMainProcess (data: any) {
  if (process.send) {
    return process.send(data)
  } else {
    log.error(`cannot send to main process! connected: ${process.connected}`)
  }
}

async function tokenBalanceScan (address: Address) {
  try {
    // for chains that support multicall, we can attempt to load every token that we know about,
    // for all other chains we need to call each contract individually so don't scan every contract
    const chains = (await getChains()).filter(chainSupportsScan)
    const tokenLists: any[] = chains.map(tokenLoader.getTokens)
    const tokens = tokenLists.reduce((all, lst) => all.concat(lst), [])

    const tokenBalances = await balances.getTokenBalances(address, tokens)

    sendToMainProcess({ type: 'tokenBalances', address, balances: tokenBalances })
  } catch (e) {
    log.error('error scanning for token balances', e)
  }
}

async function fetchTokenBalances (address: Address, tokens: TokenDefinition[]) {
  try {
    const tokenBalances = await balances.getTokenBalances(address, tokens)

    sendToMainProcess({ type: 'tokenBalances', address, balances: tokenBalances })
  } catch (e) {
    log.error('error fetching token balances', e)
  }
}

async function chainBalanceScan (address: string, symbol: string) {
  try {
    const chainBalance = await balances.getNativeCurrencyBalance(address)

    sendToMainProcess({ type: 'chainBalance', ...chainBalance, address, symbol, chainId })
  } catch (e) {
    log.error('error scanning chain balance', e)
  }
}

function ratesScan (symbols: string[], chainId: number) {
  rates(symbols, chainId)
    .then(loadedRates => sendToMainProcess({ type: 'rates', rates: loadedRates }))
    .catch(err => log.error('rates scan error', err))
}

function nativeCurrencyScan (symbols: string[]) {
  loadStaticData(symbols)
    .then(currencyData => sendToMainProcess({ type: 'nativeCurrencyData', currencyData }))
    .catch(err => log.error('native currency scan error', err))
}

function inventoryScan (addresses: string[]) {
  addresses.forEach(address => {
    inventory(address)
      .then(inventory => sendToMainProcess({ type: 'inventory', address, inventory }))
      .catch(err => log.error('inventory scan error', err))
  })
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  heartbeat = setTimeout(() => {
    log.warn('no heartbeat received in 60 seconds, worker exiting')
    process.kill(process.pid, 'SIGHUP')
  }, 60 * 1000)
}

const messageHandler: { [command: string]: (...params: any) => void } = {
  updateRates: ratesScan,
  updateNativeCurrencyData: nativeCurrencyScan,
  updateChainBalance: chainBalanceScan,
  fetchTokenBalances: fetchTokenBalances,
  tokenBalanceScan: tokenBalanceScan,
  updateInventory: inventoryScan,
  heartbeat: resetHeartbeat
}

process.on('message', (message: ExternalDataWorkerMessage) => {
  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})

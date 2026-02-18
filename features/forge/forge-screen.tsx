import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { getSessionTasks, submitTaskMemo, ForgeTask } from './forge-tasks'

type Screen = 'splash' | 'dashboard' | 'task' | 'payout' | 'complete'

const C = {
  orange: '#FF6B2B', gold: '#FFD700', black: '#0D0D0D',
  dark: '#1A1A1A', white: '#F5F0EB', ash: '#888888',
}

export function ForgeScreen() {
  const { account, connect, disconnect } = useMobileWallet()
  const [screen, setScreen] = useState<Screen>('splash')
  const [tasks] = useState<ForgeTask[]>(() => getSessionTasks())
  const [taskIdx, setTaskIdx] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [lastEarn, setLastEarn] = useState('')
  const [lastSig, setLastSig] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { connection, signAndSendTransaction } = useMobileWallet()

  const task = tasks[taskIdx]

  async function handleConnect() {
    await connect()
    setScreen('dashboard')
  }

  async function handleAnswer(answer: string) {
    if (!account || submitting) return
    setSubmitting(true)
    let sig: string | null = null
    try {
      sig = await submitTaskMemo(connection, signAndSendTransaction, account.address, task.id, answer)
    } catch (e) {
      console.log('Memo failed, continuing locally:', e)
    }
    const earn = parseFloat(task.earn.replace('+$', ''))
    setLastEarn(task.earn)
    setLastSig(sig)
    setCompleted(c => c + 1)
    setTotalEarned(t => t + earn)
    setSubmitting(false)
    setScreen('payout')
  }

  function handleNext() {
    const next = taskIdx + 1
    if (next >= tasks.length) {
      setScreen('complete')
    } else {
      setTaskIdx(next)
      setScreen('task')
    }
  }

  if (screen === 'splash') return (
    <View style={s.center}>
      <Text style={s.logo}>FORGE</Text>
      <Text style={s.slogan}>SHOW UP. STRIKE. EARN.</Text>
      <Text style={s.sub}>BUILT FOR SOLANA SEEKER</Text>
      <TouchableOpacity style={s.btn} onPress={handleConnect}>
        <Text style={s.btnText}>► CONNECT SEED VAULT</Text>
      </TouchableOpacity>
      <Text style={s.fine}>DEVNET · DEMO ONLY</Text>
    </View>
  )

  if (screen === 'dashboard') return (
    <ScrollView style={s.scroll} contentContainerStyle={s.pad}>
      <Text style={s.logo}>FORGE</Text>
      <View style={s.card}>
        <Text style={s.label}>WALLET</Text>
        <Text style={s.addr}>{account?.address.toString().slice(0,4)}...{account?.address.toString().slice(-5)}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.label}>SESSION</Text>
        <Text style={s.big}>10 TASKS READY</Text>
        <Text style={s.earn}>EST. EARN: $2.40 – $4.80</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={() => setScreen('task')}>
        <Text style={s.btnText}>► START SESSION</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.outlineBtn} onPress={disconnect}>
        <Text style={s.outlineBtnText}>DISCONNECT</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  if (screen === 'task') return (
    <ScrollView style={s.scroll} contentContainerStyle={s.pad}>
      <View style={s.progressRow}>
        <Text style={s.label}>TASK {taskIdx + 1} / {tasks.length}</Text>
        <Text style={s.earnBadge}>{task.earn}</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${(taskIdx / tasks.length) * 100}%` as any }]} />
      </View>
      <View style={s.card}>
        <Text style={s.typeTag}>{task.type}</Text>
        <Text style={s.question}>{task.question}</Text>
      </View>
      {task.options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[s.optBtn, submitting && s.dim]}
          onPress={() => handleAnswer(opt)}
          disabled={submitting}>
          {submitting
            ? <ActivityIndicator color={C.white} />
            : <Text style={s.optText}>{opt}</Text>
          }
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.skip} onPress={handleNext}>
        <Text style={s.skipText}>SKIP</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  if (screen === 'payout') return (
    <View style={s.center}>
      <Text style={s.completeTitle}>TASK COMPLETE!</Text>
      <Text style={s.earnBig}>{lastEarn}</Text>
      <Text style={s.sub}>SENT TO YOUR SEED VAULT</Text>
      {lastSig && (
        <TouchableOpacity onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${lastSig}?cluster=devnet`)}>
          <Text style={s.link}>► VIEW ON EXPLORER</Text>
        </TouchableOpacity>
      )}
      <Text style={s.progress}>{completed} / {tasks.length} FORGED</Text>
      <TouchableOpacity style={s.btn} onPress={handleNext}>
        <Text style={s.btnText}>{completed >= tasks.length ? 'FINISH ►' : 'NEXT TASK ►'}</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={s.center}>
      <Text style={s.fire}>🔥</Text>
      <Text style={s.completeTitle}>SESSION COMPLETE!</Text>
      <Text style={s.earnBig}>+${totalEarned.toFixed(2)}</Text>
      <TouchableOpacity style={s.btn} onPress={() => { setScreen('dashboard'); setTaskIdx(0); setCompleted(0); setTotalEarned(0) }}>
        <Text style={s.btnText}>← GO HOME</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.black },
  pad: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 48, color: C.orange, fontWeight: 'bold', letterSpacing: 4, marginBottom: 8 },
  slogan: { fontSize: 12, color: C.ash, letterSpacing: 2, marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 10, color: '#444', marginBottom: 32, textAlign: 'center' },
  btn: { backgroundColor: C.orange, padding: 16, alignItems: 'center', marginBottom: 12, width: '100%' },
  btnText: { color: C.black, fontWeight: 'bold', fontSize: 14 },
  outlineBtn: { borderWidth: 2, borderColor: '#333', padding: 12, alignItems: 'center' },
  outlineBtnText: { color: C.ash, fontSize: 12 },
  fine: { fontSize: 10, color: '#333', marginTop: 8 },
  card: { backgroundColor: C.dark, borderWidth: 2, borderColor: '#333', padding: 16, marginBottom: 16 },
  label: { fontSize: 10, color: C.ash, letterSpacing: 1, marginBottom: 8 },
  addr: { fontSize: 14, color: C.white },
  big: { fontSize: 20, color: C.orange, fontWeight: 'bold', marginBottom: 4 },
  earn: { fontSize: 12, color: C.gold },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  earnBadge: { backgroundColor: C.orange, color: C.black, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
  barBg: { height: 8, backgroundColor: C.dark, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  barFill: { height: '100%', backgroundColor: C.orange },
  typeTag: { color: C.orange, fontSize: 10, borderWidth: 1, borderColor: C.orange, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 12 },
  question: { fontSize: 16, color: C.white, lineHeight: 26, fontWeight: 'bold' },
  optBtn: { backgroundColor: C.dark, borderWidth: 2, borderColor: '#444', padding: 16, alignItems: 'center', marginBottom: 10 },
  optText: { color: C.white, fontSize: 14, fontWeight: 'bold' },
  dim: { opacity: 0.5 },
  skip: { padding: 12, alignItems: 'center' },
  skipText: { color: '#444', fontSize: 12 },
  completeTitle: { fontSize: 18, color: C.gold, fontWeight: 'bold', marginBottom: 12 },
  earnBig: { fontSize: 48, color: C.orange, fontWeight: 'bold', marginBottom: 8 },
  link: { color: C.orange, fontSize: 12, marginBottom: 20 },
  progress: { fontSize: 14, color: C.white, marginBottom: 24 },
  fire: { fontSize: 64, marginBottom: 16 },
})

import React from 'react'
import { StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ForgeScreen } from '@/features/forge/forge-screen'

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ForgeScreen />
    </SafeAreaView>
  )
}

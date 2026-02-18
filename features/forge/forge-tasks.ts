import { PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { createMemoInstruction } from '@solana/spl-memo'

export type ForgeTask = {
  id: string
  type: string
  question: string
  options: string[]
  earn: string
}

export const TASK_POOL: ForgeTask[] = [
  { id: 't1', type: 'AI IMAGE CLASSIFICATION', question: 'IS THIS IMAGE SAFE FOR ALL AUDIENCES?', options: ['YES — SAFE', 'NO — UNSAFE'], earn: '+$0.32' },
  { id: 't2', type: 'SENTIMENT ANALYSIS', question: 'IS THIS PRODUCT REVIEW POSITIVE OR NEGATIVE?', options: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'], earn: '+$0.28' },
  { id: 't3', type: 'DATA VERIFICATION', question: 'DOES THIS ADDRESS MATCH THE BUSINESS NAME?', options: ['MATCH', 'NO MATCH', 'UNSURE'], earn: '+$0.35' },
  { id: 't4', type: 'AI IMAGE CLASSIFICATION', question: 'WHAT CATEGORY BEST DESCRIBES THIS IMAGE?', options: ['NATURE', 'URBAN', 'PEOPLE', 'PRODUCT'], earn: '+$0.30' },
  { id: 't5', type: 'SENTIMENT ANALYSIS', question: 'IS THIS AI RESPONSE HELPFUL OR HARMFUL?', options: ['HELPFUL', 'HARMFUL', 'NEITHER'], earn: '+$0.40' },
  { id: 't6', type: 'DATA VERIFICATION', question: 'IS THIS TEXT WRITTEN BY A HUMAN OR AI?', options: ['HUMAN', 'AI GENERATED', 'UNSURE'], earn: '+$0.36' },
  { id: 't7', type: 'AI IMAGE CLASSIFICATION', question: 'IS THERE A FACE VISIBLE IN THIS IMAGE?', options: ['YES', 'NO'], earn: '+$0.22' },
  { id: 't8', type: 'SENTIMENT ANALYSIS', question: 'RATE THE CLARITY OF THIS INSTRUCTION SET', options: ['CLEAR', 'CONFUSING', 'PARTIALLY CLEAR'], earn: '+$0.29' },
  { id: 't9', type: 'DATA VERIFICATION', question: 'IS THIS TRANSLATION ACCURATE?', options: ['ACCURATE', 'INACCURATE', 'PARTIALLY'], earn: '+$0.38' },
  { id: 't10', type: 'AI IMAGE CLASSIFICATION', question: 'DOES THIS IMAGE CONTAIN VIOLENT CONTENT?', options: ['NO VIOLENCE', 'MILD', 'GRAPHIC'], earn: '+$0.45' },
]

export function getSessionTasks(): ForgeTask[] {
  return [...TASK_POOL].sort(() => Math.random() - 0.5).slice(0, 10)
}

export async function submitTaskMemo(
  connection: any,
  signAndSendTransaction: any,
  address: PublicKey,
  taskId: string,
  answer: string,
): Promise<string> {
  const { context: { slot: minContextSlot }, value: latestBlockhash } =
    await connection.getLatestBlockhashAndContext()

  const memo = `forge:${taskId}:${answer}:${Date.now()}`

  const message = new TransactionMessage({
    payerKey: address,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [createMemoInstruction(memo)],
  }).compileToLegacyMessage()

  const transaction = new VersionedTransaction(message)
  const signature = await signAndSendTransaction(transaction, minContextSlot)
  await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
  return signature
}

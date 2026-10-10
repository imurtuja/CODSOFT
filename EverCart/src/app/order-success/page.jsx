'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import OrderSuccessContent from './OrderSuccessContent'
import OrderSuccessLoading from './loading'

function OrderSuccessWrapper() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const isFresh = searchParams.get('fresh') === '1' || searchParams.get('fresh') === 'true'
  return <OrderSuccessContent initialOrderId={orderId} isFreshCheckout={isFresh} />
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessLoading />}>
      <OrderSuccessWrapper />
    </Suspense>
  )
}
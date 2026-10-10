'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import OrderSuccessContent from '../OrderSuccessContent'
import OrderSuccessLoading from '../loading'

function OrderSuccessDynamicInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const rawId = typeof params?.id === 'string' ? params.id : ''
  const isFresh = searchParams?.get('fresh') === '1' || searchParams?.get('fresh') === 'true'
  return <OrderSuccessContent initialOrderId={rawId} isFreshCheckout={isFresh} />
}

export default function OrderSuccessDynamicPage() {
  return (
    <Suspense fallback={<OrderSuccessLoading />}>
      <OrderSuccessDynamicInner />
    </Suspense>
  )
}

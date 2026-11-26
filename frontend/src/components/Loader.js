import React, { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'

const Loader = () => {
  // The free server sleeps when idle; say so instead of leaving a silent spinner.
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [])
  return (
    <>
    <Spinner
      animation='border'
      role='status'
      style={{
        width: '100px',
        height: '100px',
        margin: 'auto',
        display: 'block',
      }}
    >
      <span className='sr-only'>Loading...</span>
    </Spinner>
    {slow && (
      <p className='loader-note' role='status'>
        Waking up the demo server. The first visit can take up to a minute.
      </p>
    )}
    </>
  )
}

export default Loader

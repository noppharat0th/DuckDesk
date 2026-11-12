import { useEffect, useState } from 'react'
import DevicePage from './components/DevicePage'

function App(): React.JSX.Element {
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    window.api.getMyDevice().then((device) => {
      setDeviceId(device.deviceId)
    }).catch(() => {
      setDeviceId('Error Loading Device Id')
    })
  }, [])

  return (
    <>
      <h1>Your Device</h1>
      <DevicePage deviceId={deviceId} />
    </>
  )
}

export default App
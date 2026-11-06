import { useEffect, useState } from 'react'

function App(): React.JSX.Element {
  const [device_Id, setDeviceId] = useState()

  useEffect(() => {
    const random_device = Math.random()
    // setDeviceId(random_device)
  })
  
  return (
    <>
      <h1>Device Id</h1>
      <input type="text" value={device_Id}  />
      <button>connect</button>
    </>
  )
}

export default App

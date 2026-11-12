interface Props {
  deviceId: string
}

const DevicePage = ({ deviceId }: Props) => {
  return (
    <>
      <div>DevicePage</div>
      <input type="text" value={deviceId} readOnly />
    </>
  )
}

export default DevicePage
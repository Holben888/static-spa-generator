export default () => {
  console.log('woop woop!')

  return () => {
    console.log('cleanup time')
  }
}

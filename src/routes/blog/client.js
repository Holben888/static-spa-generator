import Prism from 'prismjs';

export default () => {
  console.log('blo')
  Prism.highlightAll(false, () => console.log('uh huh'))

  return () => {
    console.log('cleanup time')
  }
}
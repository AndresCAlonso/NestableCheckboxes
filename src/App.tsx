import { NestableCheckbox } from './components/NestableCheckbox'
import { NestableCheckboxDetails } from './types/NestableCheckboxTypes'

const testItems:NestableCheckboxDetails[] = [
  { name: 'A' },
  { name: 'B' },
  {
    name: 'C',
    children: [
      {
        name: 'CA',
        children: [
          { name: 'CAA' },
          { name: 'CAB', children: [{name: 'CABA'}]},
        ],
      },
      { name: 'CB', children: [{ name: 'CBA' }] },
    ],
  },
]

function App() {
  return (
    <div className="App">
      <NestableCheckbox checkboxes={testItems} />
    </div>
  )
}

export default App

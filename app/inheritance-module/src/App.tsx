import React, {useState, useEffect}/*, { useCallback }*/ from 'react'
import { ethers } from 'ethers';
import styled from 'styled-components'
import { Button, Title, ManageListModal, AddressInput } from '@gnosis.pm/safe-react-components'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

//Flap countdown
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`


const SafeApp = (): React.ReactElement => {
  const { sdk, safe } = useSafeAppsSDK()
  
  //Modal for inheritance change
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([
    {
      id: '1',
      iconUrl: '',
      name: '0x0000000000000000000000000000000000000001',
      checked: true,
      isDeletable: true,
    },
    {
      id: '2',
      iconUrl: '',
      name: '0x0000000000000000000000000000000000000002',
      checked: false,
      isDeletable: true,
    },
    {
      id: '3',
      iconUrl: '',
      name: '0x0000000000000000000000000000000000000003',
      checked: true,
      isDeletable: true,
    },
  ]);
  const onItemToggle = (itemId: string | number, checked: boolean) => {
    const copy = [...items];
    const localItem = copy.find((i) => i.id === itemId);
    if (!localItem) {
      return;
    }
    localItem.checked = checked;
    setItems(copy);
  };
  const [address, setAddress] = useState<string>("0x");



  // Get inheritance module data
  const [enabled, setEnabled]  = useState("inactive") 
  const [deadline, setDeadline]  = useState("inactive") 
  useEffect(() => {
    // declare the async data fetching function
    const fetchData = async () => {
      //Get module enabled
      const safe_module_INTERFACE = new ethers.utils.Interface([
        'function isModuleEnabled(address) external view returns (bool)',
      ])
      const encodedSafeModule = safe_module_INTERFACE.encodeFunctionData("isModuleEnabled", ["0xb9cBb0e33C97d9ea46Ae312a508ad2b62fF429AA"]);
      const configModule = {
        to: safe.safeAddress,
        data: encodedSafeModule
      };
      const responseModule = await sdk.eth.call([configModule])
      const enabled = ethers.utils.defaultAbiCoder.decode(["bool"], responseModule)
      setEnabled(enabled[0])

      //Get inheritance data
      const Inheritance_INTERFACE = new ethers.utils.Interface([
        'function heirs(address) external returns(address[])',
        'function deadline(address) external returns(uint256)',
      ])
      const encodedInheritanceDeadline = Inheritance_INTERFACE.encodeFunctionData("deadline", [safe.safeAddress]);
      const configDeadline = {
        to: '0xb9cBb0e33C97d9ea46Ae312a508ad2b62fF429AA',
        data: encodedInheritanceDeadline
      };
      const responseDeadline = await sdk.eth.call([configDeadline])
      const _deadline = ethers.utils.defaultAbiCoder.decode(["uint256"], responseDeadline)
      setDeadline(_deadline.toString());
    }
    // call the function and catch any error
    fetchData().catch(console.error);;
  }, [sdk.eth, safe.safeAddress])
  console.log(enabled)
  console.log(deadline)


  return (
    <Container>
      <Title size="md" withoutMargin={false}>Safe: {safe.safeAddress}</Title>


      <Button size="lg" color="primary" onClick={() => setIsOpen(!isOpen)} style={{marginBottom: '3rem'}}>
        Add inheritance
      </Button>


      <FlipClockCountdown 
        to={new Date().getTime() + 31556926 * 2 * 1000}
        labels={['DAYS', 'HOURS', 'MINUTES', 'SECONDS']}
        labelStyle={{ color: 'black', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}
        digitBlockStyle={{ width: 40, height: 60, fontSize: 30 }}
        dividerStyle={{ color: 'black', height: 1 }}
        separatorStyle={{ color: 'black', size: '6px' }}
        duration={0.5}
      >
        FINISHED
      </FlipClockCountdown>


      <Button size="lg" color="primary" onClick={() => setIsOpen(!isOpen)} style={{marginTop: '3rem'}}>
        Change inheritance
      </Button>
      {isOpen && (
        <ManageListModal
          defaultIconUrl={""}
          itemList={items}
          showDeleteButton
          addButtonLabel="Add heir"
          formBody={
          <div style={{width: "100%"}}>
            <form noValidate autoComplete="off">
              <AddressInput
                label="Address"
                name="address"
                networkPrefix="rin"
                showNetworkPrefix={false}
                placeholder={'Ethereum address'}
                showLoadingSpinner={false}
                address={address}
                onChangeAddress={setAddress}
                error={'Invalid Address'}
              />
            </form>
          </div>}
          onSubmitForm={() => undefined}
          onClose={() => setIsOpen(false)}
          onItemToggle={onItemToggle}
          onItemDeleted={() => alert('asd')}
        />
      )}


    </Container>
  )
}

export default SafeApp




/*
x   1. DEPLOY INHERITANCE ON GOERLI => 0xb9cBb0e33C97d9ea46Ae312a508ad2b62fF429AA
x   1a. call contract from app 

    2. CHECK SAFE WALLET = MODEL 
      - NO  - THEN BUTTON TO ADD INHERITANCE MODULE
      
      - YES NO HEIRS - THEN ADD INHERITANCE BUTTON 
      - YES PENDING - THEN COUNTDOWN AND BUTTON TO ADJUST INHERITANCE
        - MODULE POP UP TO ADD HEIRS AND ADJUST DEADLINE OR REMOVE INHERITANCE
      - YES FINISHED - THEN BUTTON TO EXECUTE INHERITANCE
    3. ADD DARK MODE CHECK
    4. ADD NICE FRONT END LOOK (IN TAB)
*/ 


/*
  const submitTx = useCallback(async () => {
    try {
      const { safeTxHash } = await sdk.txs.send({
        txs: [
          {
            to: safe.safeAddress,
            value: '0',
            data: '0x',
          },
        ],
      })
      console.log({ safeTxHash })
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash)
      console.log({ safeTx })
    } catch (e) {
      console.error(e)
    }
  }, [safe, sdk])
*/
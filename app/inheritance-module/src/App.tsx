import React, {useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers';
import styled from 'styled-components'
import { Button, ButtonLink, Title, GenericModal, Table, TableRow, TextField, AddressInput} from '@gnosis.pm/safe-react-components'
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
  const inheritance_address_goerli = "0xb9cBb0e33C97d9ea46Ae312a508ad2b62fF429AA"
  const { sdk, safe } = useSafeAppsSDK()



  //Modal for inheritance change
  const [isOpenInheritance, setIsOpenInheritance] = useState(false);
  const [isOpenHeirs, setIsOpenHeirs] = useState(false);
  const [idHeirs, setIdHeirs] = useState("");
  const [hasError, setHasError] = useState<boolean>();
  const [address, setAddress] = useState<string>("0x0000000000000000000000000000000000000000");
  const [rows, setRows] = useState<TableRow[]>([
    {
      id: "0", 
      cells: [{id: "a", content:"0x0000000000000000000000000000000000000001"}]
    },
  ]);
  const handleDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.currentTarget.value)
  }
  useEffect(() => {
    setHasError(!ethers.utils.isAddress(address));
  }, [address]);
  const error = 'Invalid Address';
  const setAddressHeirs = (event: string) => {
    const objWithIdIndex = rows.findIndex((obj) => obj.id === idHeirs);  
    const temp = rows
    if(ethers.utils.isAddress(event)) {
      temp[objWithIdIndex].cells[0].content = event 
      setRows(temp)
    }
    setAddress(event)
  }
  const removeAddressHeirs = () => {
    let temp = rows
    temp = temp.filter((obj) => obj.id !== idHeirs)
    setRows(temp)
    setIsOpenHeirs(false)
  }
  const modal_body_heirs =
    <div style={{textAlign:"center"}}>
      <form noValidate autoComplete="off" >
        <AddressInput
          label="Address"
          name="address"
          networkPrefix="rin"
          showNetworkPrefix={false}
          placeholder={'Ethereum address'}
          showLoadingSpinner={false}
          address={address}
          onChangeAddress={setAddressHeirs}
          error={hasError ? error : ''} 
        />
      </form>
      <Button size="lg" color="error" onClick ={() => removeAddressHeirs()} style={{marginTop: '1rem'}}>
        Remove
      </Button>
      <Button size="lg" color="primary" onClick ={() => setIsOpenHeirs(false)} style={{marginTop: '1rem'}}>
        Store
      </Button>
    </div>

    
  const addAddressHeirs = () => {
    
    setIsOpenHeirs(!isOpenHeirs)
    

    const temp = rows
    temp.push({
      id: "1", 
      cells: [{id: "b", content:"0x0000000000000000000000000000000000000002"}]
    })
    setRows(temp)
  }


  const adjustAddressHeirs = (event: string) => {
    setIsOpenHeirs(!isOpenHeirs)
    const objWithIdIndex = rows.findIndex((obj) => obj.id === event);  
    const tempAddress = rows[objWithIdIndex].cells[0].content?.toString()
    if(tempAddress){
      setAddress(tempAddress)
      setIdHeirs(event)
    }
    setIsOpenHeirs(!isOpenHeirs)
  }
  const modal_body_inheritance =
    <div style={{textAlign:"center"}}>
      <ButtonLink color="primary" iconType="add" onClick={addAddressHeirs}style={{marginBottom: '1rem'}}>
        Add heir
      </ButtonLink>
      <Table 
        rows={rows}
        onRowClick={adjustAddressHeirs}
      />
     <form className="" noValidate>
      <TextField
        id="date"
        label="Deadline"
        type="date"
        defaultValue="2023-05-24"
        className=""
        InputLabelProps={{
          shrink: true,
        }}
        onChange={handleDate}
      />
    </form>
      <Button size="lg" color="primary" style={{marginTop: '1rem'}}>
        Submit change
      </Button>
      {isOpenHeirs && (
        <GenericModal
          onClose={() => setIsOpenHeirs(false)}
          title="Change heir"
          body={modal_body_heirs}
          footer={""}
        />
      )}
    </div>
    
        




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
      const encodedSafeModule = safe_module_INTERFACE.encodeFunctionData("isModuleEnabled", [inheritance_address_goerli]);
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


  //Add inheritance module to safe
  const submitTx_addModule = useCallback(async () => {
    try {   
      const safe_module_INTERFACE = new ethers.utils.Interface([
       'function enableModule(address) external',
      ])
      const encodedAddModule = safe_module_INTERFACE.encodeFunctionData("enableModule", [inheritance_address_goerli]);
      const { safeTxHash } = await sdk.txs.send({
        txs: [
          {
            to: safe.safeAddress,
            value: '0',
            data: encodedAddModule,
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


  return (
    <Container>
      <Title size="md" withoutMargin={false}>Safe: {safe.safeAddress}</Title>


      <Button size="lg" color="primary" onClick={() => submitTx_addModule()} style={{marginBottom: '3rem'}}>
        Add inheritance module
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


      <Button size="lg" color="primary" onClick={() => setIsOpenInheritance(!isOpenInheritance)} style={{marginTop: '3rem'}}>
        Change inheritance
      </Button>
      {isOpenInheritance && (
        <GenericModal
          onClose={() => setIsOpenInheritance(false)}
          title="Change inheritance"
          body={modal_body_inheritance}
          footer={""}
        />
      )}

    </Container>
  )
}

export default SafeApp




/*
x   1. DEPLOY INHERITANCE ON GOERLI => 0xb9cBb0e33C97d9ea46Ae312a508ad2b62fF429AA
x   1a. call contract from app 
x   1b. add call add inheritance
    1c. add call add/change inheritance
    1d. add call remove inheritance
    1e. add call execute inheritance
    1x. check calls above for multiple owner safe

--
   2. CHECK SAFE WALLET = MODEL 
      - NO  - THEN BUTTON TO ADD INHERITANCE MODULE
      - YES NO HEIRS - THEN ADD INHERITANCE BUTTON 
      - YES PENDING - THEN COUNTDOWN AND BUTTON TO ADJUST INHERITANCE
        - MODULE POP UP TO ADD HEIRS AND ADJUST DEADLINE OR REMOVE INHERITANCE
      - YES FINISHED - THEN BUTTON TO EXECUTE INHERITANCE
    3. ADD DARK MODE CHECK
    4. ADD NICE FRONT END LOOK (IN TAB)
    5. DEPLOY MAINNET + ADD TO DAPP PAGE SAFE
*/ 



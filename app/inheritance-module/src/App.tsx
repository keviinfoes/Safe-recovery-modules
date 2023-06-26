import React, {useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers';
import styled from 'styled-components'
import { Button, ButtonLink, Title, GenericModal, Table, TableRow, TextField, AddressInput} from '@gnosis.pm/safe-react-components'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import Grid from '@material-ui/core/Grid';

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
  const moment = require('moment');

  const [isOpenInheritance, setIsOpenInheritance] = useState(false);
  const [isOpenHeirs, setIsOpenHeirs] = useState(false);
  const [isOpenRemove, setIsOpenRemove] = useState(false);
  const [idHeirs, setIdHeirs] = useState("");
  const [hasError, setHasError] = useState<boolean>();
  const [address, setAddress] = useState<string>("0x0000000000000000000000000000000000000000");
  const [enabled, setEnabled]  = useState("inactive") 
  const [deadline, setDeadline]  = useState("0") 
  const [tempDeadline, setTempDeadline]  = useState("0") 
  const [adjusted, setAdjusted] = useState(false);
  const [rows, setRows] = useState<TableRow[]>([]);

  const [reloaded, setReloaded] = useState(false);


  // WEB3 CALL FUNCTION - Get inheritance module data
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
        'function heirs(address, uint256) external returns(address)',
        'function deadline(address) external returns(uint256)',
      ])
      const encodedInheritanceDeadline = Inheritance_INTERFACE.encodeFunctionData("deadline", [safe.safeAddress]);
      const configDeadline = {
        to: inheritance_address_goerli,
        data: encodedInheritanceDeadline
      };
      const responseDeadline = await sdk.eth.call([configDeadline])
      const _deadline = ethers.utils.defaultAbiCoder.decode(["uint256"], responseDeadline)
      setDeadline(_deadline.toString());
      setTempDeadline(_deadline.toString())
      //Get heirs
      let end = 1
      let index = 0
      const temp = rows
      if (adjusted === false && temp.length === 0) {
        while (end === 1) {
          const encodedInheritanceHeirs = Inheritance_INTERFACE.encodeFunctionData("heirs", [safe.safeAddress, index]);
          const configHeirs = {
            to: inheritance_address_goerli,
            data: encodedInheritanceHeirs
          };
          try{
            const responseHeirs = await sdk.eth.call([configHeirs])
            const _heir_ = ethers.utils.defaultAbiCoder.decode(["address"], responseHeirs)
            temp.push({
              id: responseHeirs, 
              cells: [{id: responseHeirs, content: _heir_}]
            })
            index += 1   
          } catch (error) {
            end = 0
          }  
        }
        setRows(temp)
      }
      console.log(temp) 
    }
    setReloaded(false)
    // call the function and catch any error
    fetchData().catch(console.error);;
  }, [sdk.eth, safe.safeAddress, rows, adjusted, reloaded])
  console.log(enabled)
  // WRITE FUNCTIONS - Add inheritance module to safe
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
  //Store inheritance
  const submitTx_addInheritance = useCallback(async (heirs, _deadline) => {
    try {   
      const inheritance_module_INTERFACE = new ethers.utils.Interface([
       'function setInheritance(address[], uint256) external',
      ])
      const encodedAddInheritance = inheritance_module_INTERFACE.encodeFunctionData("setInheritance", [heirs, _deadline]);
      const { safeTxHash } = await sdk.txs.send({
        txs: [
          {
            to: inheritance_address_goerli,
            value: '0',
            data: encodedAddInheritance,
          },
        ],
      })
      console.log({ safeTxHash })
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash)
      console.log({ safeTx })
      setReloaded(true)
    } catch (e) {
      console.error(e)
    }
  }, [sdk])
  //Remove inheritance
  const submitTx_removeInheritance = useCallback(async () => {
    try {   
      const inheritance_module_INTERFACE = new ethers.utils.Interface([
       'function removeInheritance() external',
      ])
      const encodeRemoveInheritance = inheritance_module_INTERFACE.encodeFunctionData("removeInheritance");
      const { safeTxHash } = await sdk.txs.send({
        txs: [
          {
            to: inheritance_address_goerli,
            value: '0',
            data: encodeRemoveInheritance,
          },
        ],
      })
      console.log({ safeTxHash })
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash)
      console.log({ safeTx })
    } catch (e) {
      console.error(e)
    }
  }, [sdk])
  //Execute inheritance
  const submitTx_executeInheritance = useCallback(async () => {
    try {   
      const inheritance_module_INTERFACE = new ethers.utils.Interface([
       'function execute(address payable) external',
      ])
      const encodeExecuteInheritance = inheritance_module_INTERFACE.encodeFunctionData("execute", [safe.safeAddress]);
      const { safeTxHash } = await sdk.txs.send({
        txs: [
          {
            to: inheritance_address_goerli,
            value: '0',
            data: encodeExecuteInheritance,
          },
        ],
      })
      console.log({ safeTxHash })
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash)
      console.log({ safeTx })
      setIsOpenHeirs(false)
    } catch (e) {
      console.error(e)
    }
  }, [safe, sdk])

  //Modal for inheritance change
  const handleDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = new Date(event.currentTarget.value).getTime() / 1000
    setTempDeadline(timestamp.toString())
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
    setAdjusted(true)
    setRows(temp)
    setIsOpenHeirs(false)
  }
  const modal_body_remove =
    <div style={{textAlign:"center"}}>
      <div>
        Confirm that you want to remove the inheritance 
      </div>
      <Button size="lg" color="error" onClick ={submitTx_removeInheritance} style={{marginTop: '1rem'}}>
        Remove
      </Button>
    </div>
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
    const dateTime = Date.now();
    const timestamp = Math.floor(dateTime / 1000);
    const temp = rows
    const _id = timestamp.toString()
    temp.push({
      id: _id, 
      cells: [{id: _id, content:"0x0000000000000000000000000000000000000000"}]
    })
    setRows(temp)
    setAddress("0x0000000000000000000000000000000000000000")
    setIdHeirs(_id)
    setIsOpenHeirs(!isOpenHeirs)
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
  const submitInheritance = () => {
    const tempHeirs:string[] = []
    rows.forEach((row) => {
      const _heir = row.cells[0].content?.toString()
      if(_heir) {
        tempHeirs.push(_heir)
      }
    })
    const sort = tempHeirs.sort()
    submitTx_addInheritance(sort, tempDeadline)
    setIsOpenInheritance(false)
  }
  const start_time = new Date(parseInt(deadline) * 1000)
  const _date = moment(start_time).format("YYYY-MM-DDTHH:mm")
  const modal_body_inheritance =
    <div style={{textAlign:"center"}}>
      <Grid container justifyContent="space-around">
        <ButtonLink color="primary" iconType="add" onClick={addAddressHeirs} style={{marginBottom: '1rem'}}>
          Add heir
        </ButtonLink>
        <ButtonLink color="error" iconType="filledCross" onClick={(() => setIsOpenRemove(true))} style={{marginLeft: '20rem', marginBottom: '1rem'}}>
          Remove Inheritance
        </ButtonLink>
        {isOpenRemove && (
          <GenericModal
            onClose={() => setIsOpenRemove(false)}
            title="Inheritance"
            body={modal_body_remove}
            footer={""}
          />
        )}
      </Grid >
      <Table 
        rows={rows}
        onRowClick={adjustAddressHeirs}
      />
     <form className="" noValidate>
      <TextField
        id="datetime-local"
        label="Deadline"
        type="datetime-local"
        className=""
        defaultValue={_date}
        InputLabelProps={{
          shrink: true,
        }}
        onChange={handleDate}
      />
    </form>
      <Button size="lg" color="primary" onClick={submitInheritance} style={{marginTop: '1rem'}}>
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

  return (
    <Container>
      <Title size="md" withoutMargin={false}>Safe: {safe.safeAddress}</Title>
      <Button size="lg" color="primary" onClick={() => submitTx_addModule()} style={{marginBottom: '3rem'}}>
        Add inheritance module
      </Button>
      <FlipClockCountdown 
        to={parseInt(deadline) * 1000}
        labels={['DAYS', 'HOURS', 'MINUTES', 'SECONDS']}
        labelStyle={{ color: 'black', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}
        digitBlockStyle={{ width: 40, height: 60, fontSize: 30 }}
        dividerStyle={{ color: 'black', height: 1 }}
        separatorStyle={{ color: 'black', size: '6px' }}
        duration={0.5}
      >
        <Button size="lg" color="secondary" onClick ={submitTx_executeInheritance} style={{marginTop: '1rem'}}>
          Carry out inheritance
        </Button>
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
x   1c. add call add/change inheritance
x   1d. get data current heirs to display - when inheritance active
x   1e. add call remove inheritance
x   1f. add call execute inheritance

    1-. COUNTDOWN CLOCK CHANGES ON ADJUSTMENT TIME -> ADJUST SO IT ONLY SHOWS THE TIME  STORED ONCHAIN
    1-. check calls above for multiple owner safe
    1Z. MAKE FLOW FOR BUTTONS AND ON EXECUTE FINISH SHOW --SUCCESFULL EXECUTINO OF INHERITANCE -> AND REFER TO MAIN SAFE PAGE--

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



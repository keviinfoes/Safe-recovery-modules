import React/*, { useCallback }*/ from 'react'
import styled from 'styled-components'
import { /*Button,*/ Title } from '@gnosis.pm/safe-react-components'
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
  const { /*sdk,*/ safe } = useSafeAppsSDK()

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

  return (
    <Container>
      <Title size="md">Safe: {safe.safeAddress}</Title>
        <FlipClockCountdown 
          to={new Date().getTime() + 31536000 * 10 * 1000}
          labels={['DAYS', 'HOURS', 'MINUTES', 'SECONDS']}
          labelStyle={{ color: 'black', fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}
          digitBlockStyle={{ width: 40, height: 60, fontSize: 30 }}
          dividerStyle={{ color: 'black', height: 1 }}
          separatorStyle={{ color: 'black', size: '6px' }}
          duration={0.5}
        >
          FINISHED
        </FlipClockCountdown>

{/*
      <Button size="lg" color="primary" onClick={submitTx}>
        Click to send a test transaction
      </Button>
*/}
    
    </Container>
  )
}

export default SafeApp




/*
x   1. DEPLOY INHERITANCE ON GOERLI => 0xb9cBb0e33C97d9ea46Ae312a508ad2b62fF429AA
  
    1a. call contract from app

    2. CHECK SAFE WALLET = MODEL 
      - NO  - THEN BUTTON TO ADD INHERITANCE
        - MODULE POP UP TO ADD HEIRS AND SET DEADLINE
      - YES PENDING - THEN COUNTDOWN AND BUTTON TO ADJUST INHERITANCE
        - MODULE POP UP TO ADD HEIRS AND ADJUST DEADLINE
      - YES FINISHED - THEN BUTTON TO EXECUTE INHERITANCE
    3. ADD DARK MODE CHECK
    4. ADD NICE FRONT END LOOK (IN TAB)
*/ 

import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from '@material-tailwind/react';
import { useUser } from 'src/UserProvider';
import { QUICK_FIX } from 'src/Utils/types';

export const Tutorial = () => {
  const { isLogged, tutoOpen, setTutoOpen } = useUser();

  return (
    <Dialog open={tutoOpen} handler={() => setTutoOpen(false)} {...QUICK_FIX}>

      <DialogHeader {...QUICK_FIX}>Tutorial for FTplace</DialogHeader>
      <DialogBody className='max-h-[40vh] overflow-y-scroll touch-auto' {...QUICK_FIX}>
        {
          !isLogged && (
            <>
                Don&apos;t forget to login first <br/><br/>
            </>
          )
        }
        You can put pixels on the board, you can put multiple pixels at once depending of the cooldown bar on the right.<br/>
        <br/>
        Board and colors can be extended any time.<br/>
        <br/>
        Don&apos;t make admin intervene or cancel something, please.<br/>
        <br/>
        Have fun.<br/>
      </DialogBody>
      <DialogFooter {...QUICK_FIX}>
        <Button variant="gradient" color="green" onClick={() => setTutoOpen(false)} {...QUICK_FIX}>
          <span>Close</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from '@material-tailwind/react';
import { useUser } from 'src/UserProvider';

export const Tutorial = () => {
  const { isLogged, tutoOpen, setTutoOpen } = useUser();

  const quickFix = { placeholder: '', onPointerEnterCapture: () => {}, onPointerLeaveCapture: () => {} };

  return (
    <Dialog open={tutoOpen} handler={() => setTutoOpen(false)} {...quickFix}>

      <DialogHeader {...quickFix}>Tutorial for FTplace</DialogHeader>
      <DialogBody {...quickFix}>
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
      <DialogFooter {...quickFix}>
        <Button variant="gradient" color="green" onClick={() => setTutoOpen(false)} {...quickFix}>
          <span>Close</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

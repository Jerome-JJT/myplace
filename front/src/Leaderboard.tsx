import { Spinner } from '@material-tailwind/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import {
  Tabs,
  TabsHeader,
  Tab,
} from '@material-tailwind/react';
import { QUICK_FIX } from './Utils/types';

interface leaderboards {
    placed: { id: number, name: string, count: number }[] | undefined
    inPlace: { id: number, name: string, count: number }[] | undefined
}

export const Leaderboard = () => {
  const menus = [{ id: 'placed', name: 'Placed' }, { id: 'inplace', name: 'In place' }];
  const [selectedMenu, setSelectedMenu] = useState(menus[0].id);

  const [leaderboards, setLeaderboards] = useState<leaderboards>({ 'placed': undefined, 'inPlace': undefined });
  const selectedLeaderboard = useMemo(() => {
    console.log(' chec', selectedMenu);
    if (selectedMenu === 'placed') {
      return leaderboards.placed;
    }
    else if (selectedMenu === 'inplace') {
      return leaderboards.inPlace;
    }
    else {
      return undefined;
    }
  }, [leaderboards.inPlace, leaderboards.placed, selectedMenu]);

  useEffect(() => {
    axios
      .get('/api/leaderboards',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          setLeaderboards((prev) => {
            const next = { ...prev };
            next.placed = res.data.placed;
            return next;
          });

          setLeaderboards((prev) => {
            const next = { ...prev };
            next.inPlace = res.data.inPlace;
            return next;
          });
        }
      })
      .catch(() => {
      });
  }, []);

  return (
    <div className='rounded-md ml-[10vw] md:mx-auto w-min mt-[5vh] bg-orange-400'>
      <Tabs value={menus[0].id} className='w-[80vw] md:max-w-[500px]'>
        <TabsHeader {...QUICK_FIX}>
          {
            menus.map((v) => {
              return (
                <Tab key={v.id} value={v.id} {...QUICK_FIX} onClick={() => setSelectedMenu(v.id)}>
                  {v.name}
                </Tab>
              );
            })
          }
        </TabsHeader>
      </Tabs>

      <div className='min-h-[40vh] h-[70vh] max-h-[70vh] pr-4 overflow-y-scroll'>
        <div className='grid grid-cols-2'>

          <div><b>Name</b></div>
          <div><b>Count</b></div>

          {(selectedLeaderboard &&
            selectedLeaderboard.map((v, index) => {
              const isLast = index === selectedLeaderboard.length - 1;
              const classes = isLast
                ? 'py-2 break-all'
                : 'py-2 break-all border-b border-dark-red';

              return (
                <div key={v.id} className='contents'>
                  <div className={classes}>{v.name}</div>
                  <div className={classes}>{v.count}</div>
                </div>
              );
            })) || (
            <div className='py-4 col-span-2 mx-auto'>
              <Spinner className='m-auto w-12 h-12' {...QUICK_FIX} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

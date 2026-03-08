import { Button, Spinner } from '@material-tailwind/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Tabs,
  TabsHeader,
  Tab,
} from '@material-tailwind/react';
import { QUICK_FIX } from './Utils/types';

// interface banned {
//   bannedUsers: { id: number, username: string }[] | undefined
// }

export const AdminPanel = () => {

  const menus = [{ id: 'banned', name: 'Banneds' }, { id: 'admins', name: 'Admins' }];
  const [selectedMenu, setSelectedMenu] = useState('banned');

  const [bannedUsers, setBannedUsers] = useState<{ username: string, ban_reason: string }[] | undefined>(undefined);
  const [adminUsers, setAdminUsers] = useState<{ username: string }[] | undefined>(undefined);

  const [error, setError] = useState<string | undefined>(undefined);

  const [newUser, setNewUser] = useState('');
  const [banReason, setBanReason] = useState('');


  useEffect(() => {
    axios
      .get('/api/banned',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          setBannedUsers(res.data.bannedUsers);

          setError(undefined);
        }

      })
      .catch(() => {
        setError("Failed to get banned users");
      });


    axios
      .get('/api/admins',
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          setAdminUsers(res.data.adminUsers);

          setError(undefined);
        }

      })
      .catch(() => {
        setError("Failed to get admin users");
      });
  }, []);


  const addBannedUsers = () => {

    const usernames = newUser.split(',').map(u => u.trim()).filter(u => u.length > 0);

    axios
      .post('/api/banned',
        {
          doBan:      true,
          usernames:  usernames,
          ban_reason: banReason,
        },
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          setBannedUsers((banned) => {
            return [
              ...(banned || []),
              ...(usernames.map(u => { return { username: u, ban_reason: banReason} })),
            ]
          });

          setError(undefined);
        }

      })
      .catch(() => {
        setError("Failed to add banned user");
      });

    setNewUser('');
    setBanReason('');
  };

  const removeBannedUsers = (username: string) => {
    axios
      .post('/api/banned',
        {
          doBan:     false,
          usernames: [username],
        },
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          // setBannedUsers(res.data);

          // const updated = banned.bannedUsers.filter((u) => u.id !== id);

          setBannedUsers((banned) => {

            return (banned || []).filter(u => u.username !== username)
          });

          setError(undefined);
        }

      })
      .catch(() => {
        setError("Failed to add banned user");
      });

    setNewUser('');
  };


  const addAdminUsers = () => {

    const usernames = newUser.split(',').map(u => u.trim()).filter(u => u.length > 0);

    axios
      .post('/api/admins',
        {
          doAdmin:   true,
          usernames: usernames,
        },
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          setAdminUsers((admins) => {
            return [
              ...(admins || []),
              ...(usernames.map(u => { return {username: u} })),
            ]
          });

          setError(undefined);
        }

      })
      .catch(() => {
        setError("Failed to add admin user");
      });

    setNewUser('');
  };

  const removeAdminUsers = (username: string) => {
    axios
      .post('/api/admins',
        {
          doAdmin:   false,
          usernames: [username],
        },
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {

          // setBannedUsers(res.data);

          // const updated = banned.bannedUsers.filter((u) => u.id !== id);

          setAdminUsers((admins) => {

            return (admins || []).filter(u => u.username !== username)
          });

          setError(undefined);
        }

      })
      .catch(() => {
        setError("Failed to add banned user");
      });

    setNewUser('');
  };

  return (
    <div className='rounded-md ml-[10vw] md:mx-auto w-[80vw] md:max-w-[700px] mt-[5vh] bg-teal-400'>
      <Tabs value={menus[0].id} className='w-full'>
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

      <div className='min-h-[40vh] h-[70vh] max-h-[70vh] pr-4 overflow-y-scroll touch-auto'>

        {selectedMenu === 'banned' &&
          <>
            <div className="flex gap-2 mt-4 mb-2 justify-center">
              <input
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addBannedUsers(); }}
                placeholder="Username"
                className="flex-1 px-3 py-2 border border-dark-red rounded bg-black text-white"
              />
              <input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ban reason"
                className="flex-1 px-3 py-2 border border-dark-red rounded bg-black text-white"
              />

              <Button
                onClick={addBannedUsers}
                className="px-4 py-2 bg-red-500 text-white rounded hover:opacity-80"
                {...QUICK_FIX}
              >
                Add
              </Button>
            </div>

            <div className='grid grid-cols-3'>

              <div><b>Name</b></div>
              <div><b>Reason</b></div>
              <div><b>Remove</b></div>

              {(bannedUsers && bannedUsers.map((v, index) => {

                const isLast = index === bannedUsers!.length - 1;

                const classes = isLast
                  ? 'py-2 break-all'
                  : 'py-2 break-all border-b border-dark-red';

                return (
                  <div key={v.username} className='contents'>
                    <div className={classes}>{v.username}</div>
                    <div className={classes}>{v.ban_reason}</div>

                    <button
                      className={`${classes} text-red-500 font-bold hover:text-red-700`}
                      onClick={() => removeBannedUsers(v.username)}
                    >
                      x
                    </button>
                  </div>
                );

              })) || error !== undefined && (
                <span className='py-4 col-span-3 mx-auto text-red-500 font-bold'>
                  {error}
                </span>
              ) || (
                  <div className='py-4 col-span-3 mx-auto'>
                    <Spinner className='m-auto w-12 h-12' {...QUICK_FIX} />
                  </div>
                )}
            </div>
          </>
        || selectedMenu === 'admins' &&
          <>
            <div className="flex gap-2 mt-4 mb-2 justify-center">
              <input
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addAdminUsers(); }}
                placeholder="Username"
                className="flex-1 px-3 py-2 border border-dark-red rounded bg-black text-white"
              />

              <Button
                onClick={addAdminUsers}
                className="px-4 py-2 bg-red-500 text-white rounded hover:opacity-80"
                {...QUICK_FIX}
              >
                Add
              </Button>
            </div>

            <div className='grid grid-cols-2'>

              <div><b>Name</b></div>
              <div><b>Remove</b></div>

              {(adminUsers && adminUsers.map((v, index) => {

                const isLast = index === adminUsers!.length - 1;

                const classes = isLast
                  ? 'py-2 break-all'
                  : 'py-2 break-all border-b border-dark-red';

                return (
                  <div key={v.username} className='contents'>
                    <div className={classes}>{v.username}</div>

                    <button
                      className={`${classes} text-red-500 font-bold hover:text-red-700`}
                      onClick={() => removeAdminUsers(v.username)}
                    >
                      x
                    </button>
                  </div>
                );

              })) || error !== undefined && (
                <span className='py-4 col-span-2 mx-auto text-red-500 font-bold'>
                  {error}
                </span>
              ) || (
                  <div className='py-4 col-span-2 mx-auto'>
                    <Spinner className='m-auto w-12 h-12' {...QUICK_FIX} />
                  </div>
                )}
            </div>
          </>
        }


      </div>
    </div>
  );
};

import axios from 'axios';
import { useCallback, useState } from 'react';
import {
  Input,
  Button,
} from "@material-tailwind/react";
import SHA256 from 'crypto-js/sha256';

import { QUICK_FIX } from './Utils/types';
import { DEV_MODE, ENABLE_LOCAL_CREATE } from './Utils/consts';
import { useNotification } from './NotificationProvider';
import { useUser } from './UserProvider';
import { useNavigate } from 'react-router-dom';

export const LocalLogin = () => {
  const [selectedMode, setSelectedMode] = useState('login');
  const [errorBox, setErrorBox] = useState<string[]>([]);

  const [fieldUsername, setFieldUsername] = useState('');
  const [fieldEmail, setFieldEmail] = useState('');
  const [fieldPassword, setFieldPassword] = useState('');
  const [fieldRepeat, setFieldRepeat] = useState('');

  const { addNotif } = useNotification();
  const { getUserData, infos } = useUser();
  const navigate = useNavigate();

  const loginAccountAction = useCallback(() => {
    axios
      .post('/api/login/login',
        { 
          username: fieldUsername,
          password: SHA256(fieldPassword).toString(),
        },
        { withCredentials: true },
      )
      .then((res) => {
        if (res.status === 200) {
          getUserData();
          navigate('/');
          setErrorBox([]);
        }
      })
      .catch((err) => {
        if (err.response.status === 410) {
          setErrorBox(err.response.data.errors);
        }
        else {
          setErrorBox([`Unexpected error ${err.response.status}`])
        }
      });
  }, [fieldUsername, fieldPassword]);

  const createAccountAction = useCallback(() => {

    const errors = [];

    // const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const regex = DEV_MODE ? /^(?=.{4,}).*$/ : /^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

    if (regex.test(fieldPassword) == false) {
      errors.push('Password need lowercase, uppercase, numbers and at least 8 characters')
    }
    if (fieldPassword !== fieldRepeat) {
      errors.push('Password no not match')
    }

    if (errors.length > 0) {
      setErrorBox(errors);
    }
    else {
      setErrorBox([]);
      axios
        .post('/api/login/create',
          { 
            username: fieldUsername,
            email: fieldEmail,
            password: SHA256(fieldPassword).toString(),
          },
          { withCredentials: true },
        )
        .then((res) => {
          if (res.status === 201) {
            setFieldPassword('');
            setSelectedMode('login')
            addNotif('Account created, login now', 'success')
          }
        })
        .catch((err) => {
          if (err.response.status === 410) {
            setErrorBox(err.response.data.errors);
          }
          else {
            setErrorBox([`Unexpected error ${err.response.status}`])
          }
        });

    }
  }, [fieldUsername, fieldEmail, fieldPassword, fieldRepeat]);

  return (
    <div className='rounded-md pt-[40px] ml-[10vw] md:mx-auto w-[80vw] md:max-w-[500px] mt-[5vh] bg-green-400'>
      <div className='w-full min-h-[40vh] h-[70vh] max-h-[70vh] pr-4 text-black text-center'>
        <span className='font-bold text-2xl'>
          {selectedMode === 'login' && 'Sign In' || selectedMode === 'create' && 'Sign up'}
        </span>

        <form className="mt-8 mb-2 w-80 mx-auto sm:w-96" autoComplete='off'>
          <input autoComplete='off' className='hidden'></input>
          <div className="mb-1 flex flex-col gap-6">

            <div>
              <label htmlFor='locallogin-username'>Username</label>
              <Input
                {...QUICK_FIX}
                id='locallogin-username'
                size="lg"
                placeholder="username"
                className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                onChange={(e) => { setFieldUsername(e.target.value) }}
              />
            </div>

            {selectedMode === 'create' && (
              <div>
                <label htmlFor='locallogin-email'>Email</label>
                <Input
                  {...QUICK_FIX}
                  id='locallogin-email'
                  size="lg"
                  placeholder="name@mail.com"
                  className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                  onChange={(e) => { setFieldEmail(e.target.value) }}
                />
              </div>
            )}

            <div>
              <label htmlFor='locallogin-password'>Password</label>
              <Input
                {...QUICK_FIX}
                id='locallogin-password'
                type="password"
                size="lg"
                placeholder="********"
                className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                onChange={(e) => { setFieldPassword(e.target.value) }}
              />
            </div>

            {selectedMode === 'create' && (
              <div>
                <label htmlFor='locallogin-repeat'>Repeat password</label>
                <Input
                  {...QUICK_FIX}
                  id='locallogin-repeat'
                  type="password"
                  size="lg"
                  placeholder="********"
                  className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                  onChange={(e) => { setFieldRepeat(e.target.value) }}
                />
              </div>
            )}

          </div>


          {errorBox?.length > 0 && (
            errorBox.map((e) => (
              <li className='text-red-500' key={e}>{e}</li>
            ))
          )}

          {selectedMode === 'login' && (
            <>
              <Button onClick={loginAccountAction} className="mt-6" fullWidth {...QUICK_FIX}>
                Login
              </Button>
              {(ENABLE_LOCAL_CREATE || infos?.soft_is_admin) && (
                <div className="mt-4 text-center text-lg">
                  Need an account?
                  {" "}
                  <a onClick={() => { setSelectedMode('create') }} className="font-medium text-blue-700 hover:underline">
                    Create account
                  </a>
                </div>
                )
              }
            </>
          ) || selectedMode === 'create' && (
            <>
              <Button onClick={createAccountAction} className="mt-6" fullWidth {...QUICK_FIX}>
                Create account
              </Button>
              <div className="mt-4 text-center text-lg">
                Already have an account?
                {" "}
                <a onClick={() => { setSelectedMode('login') }} className="font-medium text-blue-700 hover:underline">
                  Sign In
                </a>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

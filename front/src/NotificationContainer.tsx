import {
  Alert,
} from '@material-tailwind/react';
import { AiFillCheckCircle, AiFillCloseCircle, AiFillInfoCircle, AiFillQuestionCircle, AiFillWarning } from 'react-icons/ai';
import classNames from 'classnames';
import styled from 'styled-components';
import { useNotification } from './NotificationProvider';

const StyledAlert = styled.div`
  button {
    color: #666;
  }
`;

export function NotificationContainer(): JSX.Element {
  const { notifications, removeNotif } = useNotification();

  const iconSize = '24px';

  function NotifIcon(type: string): JSX.Element {
    switch (type) {
    case 'question':
      return <AiFillQuestionCircle size={iconSize} />;

    case 'info':
      return <AiFillInfoCircle size={iconSize} />;

    case 'success':
      return <AiFillCheckCircle size={iconSize} />;

    case 'warning':
      return <AiFillWarning size={iconSize} />;

    case 'error':
      return <AiFillCloseCircle size={iconSize} />;
    }

    return <></>;
  }

  function NotifColor(type: string) {
    switch (type) {
    case 'question':
      return {
        borderColor:     'rgb(240 98 146)',
        backgroundColor: 'rgb(252 228 236)',
        color:           'rgb(240 98 146)',
      };

    case 'info':
      return {
        borderColor:     'rgb(30 136 229)',
        backgroundColor: 'rgb(187 222 251)',
        color:           'rgb(30 136 229)',
      };

    case 'success':
      return {
        borderColor:     'rgb(67 160 71)',
        backgroundColor: 'rgb(200 230 201)',
        color:           'rgb(67 160 71)',
      };

    case 'warning':
      return {
        borderColor:     'rgb(255 143 0)',
        backgroundColor: 'rgb(255 236 179)',
        color:           'rgb(255 143 0)',
      };

    case 'error':
      return {
        borderColor:     'rgb(229 57 53)',
        backgroundColor: 'rgb(255 205 210)',
        color:           'rgb(229 57 53)',
      };
    }
  }

  return (
    <StyledAlert className='fixed bottom-0 left-4 mb-5 mr-5 z-20 space-y-2'>
      { notifications.map((notif) =>
        <Alert
          key={notif.id}
          icon={NotifIcon(notif.type.toLowerCase())}
          open={notif.open}
          animate={{
            mount:   { x: 0 },
            unmount: { x: -200 },
          }}
          onClose={() => { removeNotif(notif.id); }}
          className={classNames('rounded-none border-l-4 font-medium', `notif-${notif.type.toLowerCase()}`)}
          style={{ ...NotifColor(notif.type.toLowerCase()) }}
        >
          <div className='flex flex-row gap-2 '>
            {notif.text}
          </div>
        </Alert>,
      )}
    </StyledAlert>
  );
}

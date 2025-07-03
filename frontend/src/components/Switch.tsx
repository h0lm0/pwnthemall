interface SwitchProps {
  isOn: boolean;
  handleToggle: () => void;
}

const Switch: React.FC<SwitchProps> = ({ isOn, handleToggle }) => {
  return (
    <div
      onClick={handleToggle}
      className={`flex items-center cursor-pointer rounded-full p-1 ${isOn ? 'bg-cyan-400' : 'bg-gray-300'}`}
      style={{ width: '50px', height: '25px' }}
    >
      <div
        className={`bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? 'translate-x-6' : 'translate-x-0'}`}
        style={{ width: '20px', height: '20px' }}
      />
    </div>
  );
};

export default Switch;
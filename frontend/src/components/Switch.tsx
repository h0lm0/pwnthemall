interface SwitchProps {
  isOn: boolean;
  handleToggle: () => void;
}

const Switch: React.FC<SwitchProps> = ({ isOn, handleToggle }) => {
  return (
    <div
      onClick={handleToggle}
      className={`relative flex items-center cursor-pointer rounded-full p-1 transition-colors ${isOn ? 'bg-cyan-400' : 'bg-gray-300'}`}
      style={{ width: '60px', height: '28px' }}
    >
      <span
        className={`absolute left-1 text-sm transition-opacity ${isOn ? 'opacity-50' : 'opacity-100'}`}
        style={{ pointerEvents: 'none' }}
      >
        ☀️
      </span>
      <span
        className={`absolute right-1 text-sm transition-opacity ${isOn ? 'opacity-100' : 'opacity-50'}`}
        style={{ pointerEvents: 'none' }}
      >
        🌙
      </span>
      <div
        className={`bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? 'translate-x-7' : 'translate-x-0'}`}
        style={{ width: '24px', height: '24px' }}
      />
    </div>
  );
};

export default Switch;

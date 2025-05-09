import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTelegram } from '@/context/TelegramContext';

interface CheckoutScreenProps {
  onBackClick: () => void;
  onHomeClick: () => void;
  onOrderComplete?: (orderNumber: string) => void;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
}

const CheckoutScreen = ({ 
  onBackClick, 
  onHomeClick, 
  onOrderComplete,
  total, 
  items = [] 
}: CheckoutScreenProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [selectedSpot] = useState('Surf кофе на красной поляне');
  const [orderNumber, setOrderNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pickupTime, setPickupTime] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledTime, setScheduledTime] = useState('');

  const { user } = useTelegram();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const confirmOrder = () => {
    setProcessingPayment(true);
    
    // Имитация обработки заказа
    setTimeout(() => {
      const newOrderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderNumber(newOrderNumber);
      setCurrentStep('success');
      setProcessingPayment(false);
    }, 1500);
  };

  const handleNextStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      confirmOrder();
    }
  };

  // Обработчик выбора времени
  const handleScheduledTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduledTime(e.target.value);
  };

  // Обработчик нажатия кнопки "Новый заказ"
  const handleNewOrder = () => {
    if (onOrderComplete && orderNumber) {
      onOrderComplete(orderNumber);
    } else {
      onHomeClick();
    }
  };

  return (
    <div className="h-full flex flex-col text-white bg-gradient-to-b from-[#1D1816] via-[#2C2320] to-[#1D1816]">
      {/* Верхний декоративный эффект */}
      <div className="absolute top-0 left-0 right-0 h-60 opacity-70 z-0"
           style={{ 
             backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C6D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", 
             backgroundSize: "40px 40px"
           }}></div>
           
      {/* Заголовок */}
      {currentStep !== 'success' && (
        <div className="px-6 pt-4 pb-2 relative z-10 flex items-center">
          <button onClick={onBackClick} className="p-2 mr-2 bg-white/5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold flex items-center">
            {currentStep === 'details' ? 'Оформление заказа' : 'Оплата'}
            <div className="ml-2 w-2 h-2 rounded-full bg-[#A67C52] animate-pulse"></div>
          </h2>
        </div>
      )}
      
      {/* Шаги заказа */}
      <div className="flex-1 overflow-auto pb-24 relative z-10">
        {/* Шаг 1: Детали заказа */}
        {currentStep === 'details' && (
          <div className={`px-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Информация о точке самовывоза */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Кофейня для самовывоза</h3>
              
              {/* Карта точки самовывоза (OpenStreetMap) */}
              <div className="relative h-48 w-full mb-4 rounded-xl overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10"></div>
                <iframe 
                  src="https://www.openstreetmap.org/export/embed.html?bbox=40.2724%2C43.6727%2C40.2744%2C43.6747&amp;layer=mapnik&amp;marker=43.6737%2C40.2734" 
                  className="w-full h-full border-0"
                  title="Карта местоположения"
                  loading="lazy"
                ></iframe>
                <div className="absolute bottom-2 right-2 z-20 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  © OpenStreetMap
                </div>
              </div>
              
              {/* Информация о точке самовывоза */}
              <div className="w-full py-3 px-4 text-left rounded-xl bg-[#A67C52]/20 border-[#A67C52] border flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span>{selectedSpot}</span>
                    <div className="text-white/60 text-xs mt-0.5">Эсто-Садок, ул. Горная Карусель, 5</div>
                  </div>
                </div>
                <svg className="h-5 w-5 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            {/* Выбор времени получения */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Время получения</h3>
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 mr-2 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Когда вам будет удобно забрать заказ?</span>
                  </div>
                  <div className="flex space-x-2 mb-3">
                    <button 
                      onClick={() => setPickupTime('asap')} 
                      className={`py-3 px-4 rounded-xl transition-all flex-1 ${
                        pickupTime === 'asap' ? 'bg-[#A67C52] text-white' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      Как можно скорее
                    </button>
                    <button 
                      onClick={() => setPickupTime('scheduled')} 
                      className={`py-3 px-4 rounded-xl transition-all flex-1 ${
                        pickupTime === 'scheduled' ? 'bg-[#A67C52] text-white' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      Ко времени
                    </button>
                  </div>
                  
                  {pickupTime === 'scheduled' && (
                    <div className="mt-3">
                      <label className="text-sm text-white/70 block mb-2">Выберите время:</label>
                      <input 
                        type="time" 
                        className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                        value={scheduledTime}
                        onChange={handleScheduledTimeChange}
                        min="08:00"
                        max="21:30"
                      />
                      <p className="mt-2 text-sm text-white/50">
                        Время работы: 8:00 - 22:00
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Комментарий к заказу */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Комментарий</h3>
              <textarea 
                className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/40"
                placeholder="Например: без сахара, нужны трубочки и т.д."
              />
            </div>
          </div>
        )}
        
        {/* Шаг 2: Оплата */}
        {currentStep === 'payment' && (
          <div className={`px-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Способ оплаты */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Способ оплаты</h3>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                    paymentMethod === 'card' 
                      ? 'bg-[#A67C52] text-white' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Карта</span>
                  </div>
                </button>
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                    paymentMethod === 'cash' 
                      ? 'bg-[#A67C52] text-white' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>Наличные</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Данные карты (если выбрана карта) */}
            {paymentMethod === 'card' && (
              <div className="mb-6 space-y-4">
                <div className="relative h-48 perspective-1000">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#8B5A2B] to-[#3E2723] shadow-lg p-5 transform transition-all border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs opacity-60 mb-1">Владелец карты</div>
                        <div className="font-medium tracking-wide">
                          {user?.first_name} {user?.last_name}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs opacity-60 mb-1">Баланс</div>
                        <div className="font-medium">15,240 ₽</div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <div className="text-xs opacity-60 mb-1">Номер карты</div>
                      <div className="font-medium tracking-widest">•••• •••• •••• 4242</div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-6">
                      <div>
                        <div className="text-xs opacity-60 mb-1">Истекает</div>
                        <div className="font-medium">05/27</div>
                      </div>
                      <div>
                        <svg className="h-8 w-8 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                          <circle cx="12" cy="12" r="5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button className="w-full py-3 px-4 text-left rounded-xl transition-all bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2 text-[#A67C52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Добавить новую карту</span>
                    </div>
                    <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Подготовка сдачи (если выбраны наличные) */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Подготовить сдачу с:</h3>
                <div className="flex space-x-2">
                  {[500, 1000, 2000, 5000].map((amount) => (
                    <button 
                      key={amount}
                      className="flex-1 py-2 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm"
                    >
                      {amount} ₽
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input 
                    type="number" 
                    placeholder="Другая сумма"
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Шаг 3: Успешное оформление заказа */}
        {currentStep === 'success' && (
          <div className={`px-6 pt-8 flex flex-col items-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 text-center">Ваш заказ принят!</h3>
            <p className="text-white/70 text-center mb-6">Заказ {orderNumber} успешно оформлен</p>
            
            <div className="w-full bg-[#2A2118]/85 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 shadow-[#A67C52]/30 p-4 mb-6">
              <h4 className="text-lg font-medium mb-3">Информация о заказе</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-white/70">Номер заказа:</div>
                <div className="text-right font-medium">{orderNumber}</div>
                
                <div className="text-white/70">Статус:</div>
                <div className="text-right font-medium text-green-500">Принят</div>
                
                <div className="text-white/70">Метод оплаты:</div>
                <div className="text-right font-medium">{paymentMethod === 'card' ? 'Карта' : 'Наличные'}</div>
                
                <div className="text-white/70">Место получения:</div>
                <div className="text-right font-medium">{selectedSpot}</div>
                
                <div className="text-white/70">Время готовности:</div>
                <div className="text-right font-medium">~15-20 минут</div>
              </div>
            </div>
            
            <div className="w-full p-4 bg-[#A67C52]/20 rounded-xl border border-[#A67C52]/30 mb-8">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-[#A67C52] mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm">Статус заказа будет обновляться в реальном времени. Вы получите уведомление, когда заказ будет готов к выдаче.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleNewOrder}
              className="w-full py-4 bg-gradient-to-r from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#A67C52]/30 transition-all"
            >
              Новый заказ
            </button>
            
            <button 
              className="w-full py-3 bg-transparent border border-white/20 hover:bg-white/5 text-white/70 rounded-xl font-medium mt-3 transition-all"
              onClick={handleNewOrder}
            >
              Вернуться на главную
            </button>
          </div>
        )}
      </div>
      
      {/* Итоговая сумма и кнопка подтверждения заказа */}
      {currentStep !== 'success' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1D1816]/90 backdrop-blur-md px-6 py-4 border-t border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-white/70">Итого:</div>
              <div className="text-xl font-bold">{total} ₽</div>
            </div>
            <div className="text-white/70">
              {items.reduce((sum, item) => sum + item.quantity, 0)} товаров
            </div>
          </div>
          <button 
            onClick={handleNextStep}
            disabled={processingPayment}
            className={`w-full py-4 bg-gradient-to-r from-[#A67C52] to-[#5D4037] hover:from-[#B98D6F] hover:to-[#6D4C41] text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-[#A67C52]/30 flex items-center justify-center ${processingPayment ? 'opacity-80' : ''}`}
          >
            {processingPayment ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Обработка...
              </>
            ) : (
              <>
                <span>{currentStep === 'details' ? 'Продолжить' : 'Оплатить'}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutScreen; 
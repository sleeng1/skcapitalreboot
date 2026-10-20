/**
 * СК Капитал — Промышленная антикоррозийная защита и окраска металлоконструкций
 * Логика форм, маски телефона, мобильного меню и карты
 */

// Конфигурация Telegram бота для приема заявок
// Для подключения укажите токен вашего бота и ID чата
const TELEGRAM_CONFIG = {
  botToken: 'YOUR_BOT_TOKEN', // пример: 123456789:ABCdefGhIJKlmNoPQRstuVWXyz
  chatId: 'YOUR_CHAT_ID'      // пример: -100123456789 или 987654321
};

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initForms();
  initPhoneMasks();
  initYandexMap();
});

/* ==========================================================================
   Мобильная навигация
   ========================================================================== */
function initMobileNav() {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');

  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Закрывать при клике вне меню
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !burger.contains(e.target) && nav.classList.contains('nav--open')) {
      nav.classList.remove('nav--open');
    }
  });
}

/* ==========================================================================
   Маска ввода номера телефона (+7 (XXX) XXX-XX-XX)
   ========================================================================== */
function initPhoneMasks() {
  const inputs = document.querySelectorAll('input[type="tel"]');

  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (!val) {
        e.target.value = '';
        return;
      }

      if (val[0] === '8') val = '7' + val.substring(1);
      if (val[0] !== '7') val = '7' + val;

      let formatted = '+7';
      if (val.length > 1) formatted += ' (' + val.substring(1, 4);
      if (val.length >= 5) formatted += ') ' + val.substring(4, 7);
      if (val.length >= 8) formatted += '-' + val.substring(7, 9);
      if (val.length >= 10) formatted += '-' + val.substring(9, 11);

      e.target.value = formatted;
    });

    input.addEventListener('focus', (e) => {
      if (!e.target.value) {
        e.target.value = '+7 (';
      }
    });

    input.addEventListener('blur', (e) => {
      if (e.target.value === '+7 (' || e.target.value === '+7') {
        e.target.value = '';
      }
    });
  });
}

/* ==========================================================================
   Обработка отправки форм в Telegram
   ========================================================================== */
function initForms() {
  const forms = document.querySelectorAll('.ajax-form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const statusBox = form.querySelector('.form-status');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Отправить';

      const formData = new FormData(form);
      const name = formData.get('name')?.toString().trim() || 'Не указано';
      const phone = formData.get('phone')?.toString().trim() || '';
      const service = formData.get('service')?.toString().trim() || '';
      const volume = formData.get('volume')?.toString().trim() || '';
      const message = formData.get('message')?.toString().trim() || '';
      const formTitle = form.getAttribute('data-form-title') || 'Заявка с сайта';

      if (!phone || phone.length < 16) {
        showStatus(statusBox, 'error', 'Пожалуйста, укажите корректный номер телефона для связи.');
        return;
      }

      // Формирование сообщения для Telegram
      let text = `⚡ *${escapeMarkdown(formTitle)}*\n\n`;
      text += `👤 *Контактное лицо:* ${escapeMarkdown(name)}\n`;
      text += `📞 *Телефон:* ${escapeMarkdown(phone)}\n`;
      if (service) text += `🛠 *Вид работ:* ${escapeMarkdown(service)}\n`;
      if (volume) text += `📐 *Объем:* ${escapeMarkdown(volume)}\n`;
      if (message) text += `💬 *Детали проекта:* ${escapeMarkdown(message)}\n`;
      text += `\n📍 *Компания:* СК Капитал (г. Пермь)\n`;
      text += `🕒 *Время:* ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' })} (Пермь)`;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Отправка...';
      }

      // Если бот настроен - отправляем в Telegram API
      if (TELEGRAM_CONFIG.botToken && TELEGRAM_CONFIG.botToken !== 'YOUR_BOT_TOKEN') {
        try {
          const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CONFIG.chatId,
              text: text,
              parse_mode: 'Markdown'
            })
          });

          if (res.ok) {
            showStatus(statusBox, 'success', 'Заявка принята! Инженер свяжется с вами в течение 15 минут для расчета.');
            form.reset();
          } else {
            throw new Error('Telegram API error');
          }
        } catch (err) {
          console.warn('Ошибка отправки в Telegram:', err);
          showStatus(statusBox, 'error', 'Не удалось отправить заявку через шлюз. Пожалуйста, позвоните нам напрямую или напишите в Telegram.');
        }
      } else {
        // Демо-режим (токен еще не настроен клиентом)
        console.log('[СК Капитал] Заявка подготовлена к отправке:\n', text);
        setTimeout(() => {
          showStatus(statusBox, 'success', 'Заявка принята! (Демо-режим: укажите токен бота в js/main.js для реальной отправки в TG). Инженер свяжется с вами.');
          form.reset();
        }, 600);
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  });
}

function showStatus(el, type, text) {
  if (!el) return;
  el.className = 'form-status';
  el.classList.add(`form-status--${type}`);
  el.textContent = text;
  el.style.display = 'block';

  setTimeout(() => {
    el.style.display = 'none';
  }, 8000);
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

/* ==========================================================================
   Инициализация Яндекс.Карты (Адрес: Пермь, ул. Промышленная, 117 лит. О)
   ========================================================================== */
function initYandexMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Координаты: Пермь, ул. Промышленная, 117
  const COORDS = [57.925828, 56.177033];

  if (typeof ymaps !== 'undefined') {
    ymaps.ready(() => {
      try {
        const map = new ymaps.Map('map', {
          center: COORDS,
          zoom: 15,
          controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
        });

        const placemark = new ymaps.Placemark(COORDS, {
          balloonContentHeader: '<strong style="color:#0f172a;font-size:14px;">СК «Капитал»</strong>',
          balloonContentBody: '<div style="font-size:13px;line-height:1.5;">г. Пермь, ул. Промышленная, 117, лит. О<br><strong>Производственный цех и склад</strong><br>Прием металлоконструкций: Пн-Пт 08:00 - 18:00</div>',
          balloonContentFooter: '<div style="margin-top:6px;"><a href="tel:+7XXXXXXXXXX" style="color:#f97316;font-weight:600;">+7 (XXX) XXX-XX-XX</a></div>',
          hintContent: 'СК Капитал — цех антикоррозийных покрытий'
        }, {
          preset: 'islands#nightDotIconWithCaption',
          iconColor: '#f97316'
        });

        map.geoObjects.add(placemark);
        map.behaviors.disable('scrollZoom');
      } catch (err) {
        console.warn('Ошибка инициализации ymaps:', err);
        fallbackToIframe(mapElement);
      }
    });
  } else {
    fallbackToIframe(mapElement);
  }
}

function fallbackToIframe(el) {
  // Надежный встраиваемый виджет Яндекс.Карт без обязательного API-ключа
  el.innerHTML = `
    <iframe 
      src="https://yandex.ru/map-widget/v1/?ll=56.177033%2C57.925828&z=15&pt=56.177033,57.925828,pm2orgm&text=%D0%A1%D0%9A%20%D0%9A%D0%B0%D0%BF%D0%B8%D1%82%D0%B0%D0%BB%20%D0%9F%D0%B5%D1%80%D0%BC%D1%8C%20%D0%9F%D1%80%D0%BE%D0%BC%D1%8B%D1%88%D0%BB%D0%B5%D0%BD%D0%BD%D0%B0%D1%8F%20117" 
      width="100%" 
      height="100%" 
      frameborder="0" 
      allowfullscreen="true" 
      style="position:relative; width:100%; height:100%;">
    </iframe>
  `;
}

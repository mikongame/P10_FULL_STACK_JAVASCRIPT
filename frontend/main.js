import { Header } from './src/components/Header.js';
import { LoginRegister } from './src/pages/LoginRegister/LoginRegister.js';
import { EventList } from './src/pages/EventList/EventList.js';
import { EventDetail } from './src/pages/EventDetail/EventDetail.js';
import { CreateEvent } from './src/pages/CreateEvent/CreateEvent.js';

const routes = {
  '/': EventList,
  '/login': LoginRegister,
  '/create-event': CreateEvent,
  '/event/:eventId': EventDetail,
};

const router = async () => {
  const path = window.location.pathname;
  
  const headerRoot = document.getElementById('header-root');
  headerRoot.innerHTML = '';
  headerRoot.appendChild(Header());
  
  let matchedRoute = null;
  let params = {};
  
  for (const [route, component] of Object.entries(routes)) {
    const routeRegex = new RegExp('^' + route.replace(/:\w+/g, '([^/]+)') + '$');
    const match = path.match(routeRegex);
    
    if (match) {
      matchedRoute = component;
      
      const paramNames = route.match(/:\w+/g) || [];
      paramNames.forEach((param, index) => {
        params[param.slice(1)] = match[index + 1];
      });
      
      break;
    }
  }
  
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  
  if (matchedRoute) {
    const page = await matchedRoute(params);
    main.appendChild(page);
  } else {
    main.innerHTML = '<div class="not-found"><h1>404 - Página no encontrada</h1></div>';
  }
};

window.navigateTo = (path) => {
  window.history.pushState({}, '', path);
  router();
};

window.addEventListener('popstate', router);

router();

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDomServer = require('react-dom/server');

var _srcPagesPriceVariation = require('./src/pages/PriceVariation');

var _srcPagesPriceVariation2 = _interopRequireDefault(_srcPagesPriceVariation);

var _srcContextPVContext = require('./src/context/PVContext');

var _srcContextPOContext = require('./src/context/POContext');

var indices = [{
  id: '1', month: 'January 2026', al: 10, cu: 10, crgo: 10, steel315: 10, insulating3: 10, oil: 10, cpi: 10, fixed: 100
}];
var pos = [{
  id: '1', poNo: 'PO1', utilityBoard: 'UPCL', conductorType: 'Aluminium', capacity: '100kVA', baseMonthStr: 'January 2026', exWorks: 1000, freight: 100, gstRate: 18, quantity: 1, weightFixed: 15, weightAl: 22, weightCu: 0, weightCrgo: 36, weightSteel: 12, weightInsulating: 5, weightOil: 10, weightCpi: 0
}];

var App = function App() {
  return _react2['default'].createElement(
    _srcContextPVContext.PVContext.Provider,
    { value: { indices: indices, addIndex: function addIndex() {}, updateIndex: function updateIndex() {}, getIndexByMonth: function getIndexByMonth(m) {
          return indices.find(function (i) {
            return i.month.toLowerCase() === m.toLowerCase();
          });
        } } },
    _react2['default'].createElement(
      _srcContextPOContext.POContext.Provider,
      { value: { pos: pos, addPO: function addPO() {}, boards: [], capacities: [], gstRates: [] } },
      _react2['default'].createElement(_srcPagesPriceVariation2['default'], null)
    )
  );
};

try {
  var html = (0, _reactDomServer.renderToString)(_react2['default'].createElement(App, null));
  console.log("Rendered successfully!", html.length);
} catch (e) {
  console.error("CRASH:", e);
}

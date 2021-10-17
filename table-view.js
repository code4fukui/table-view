import { create, createTable, createSelect, createButton } from "https://js.sabae.cc/stdcomp.js";
import { CSV } from "https://js.sabae.cc/CSV.js";

class TableView extends HTMLElement {
  constructor() {
    super();
    this.init();
  }
  async init() {
    const data = await CSV.fetch(this.getAttribute("src"));
    const divtbl = create("div", this);
    
    const pagen = 100;
    let page = 0;
    let npage = Math.floor((data.length - 1) / pagen) + (data.length - 1 % pagen == 0 ? 0 : 1);
    let showdata = null;
    const sorts = [];
    const addSort = (sortkey, up) => {
      const s = sorts.find(s => s.key == sortkey);
      if (s) {
        const ns = sorts.indexOf(s);
        sorts.splice(ns, 1);
      }
      sorts.unshift({ key: sortkey, up });
      console.log(sorts);
      /*
      const header = showdata.slice(0, 1);
      const sort = sorts[0];
      const nsort = header[0].findIndex(s => s == sort.key);
      showdata.sort((a, b) => {
        //const nlen = showdata.length;
        //console.log(sort.key);
        const n = a[nsort].localeCompare(b[nsort]);
        return sort.up ? n : -n;
      });
      showdata.unshift(header);
      */
      show();
    };
    const show = (n = page) => {
      const data = showdata;
      if (n < 0) {
        n = 0;
      } else if (n >= npage) {
        n = npage - 1;
      }
      page = n;
      sel.value = "page " + (page + 1);
      const header = data.slice(0, 1)[0].map(h => {
        const div = create("div");
        const name = create("span", div);
        name.textContent = h;
        const btns = create("span", div, "sortbtn");
        const upbtn = create("span", btns);
        upbtn.textContent = "▲";
        const downbtn = create("span", btns);
        downbtn.textContent = "▼";
        upbtn.onclick = () => addSort(h, true);
        downbtn.onclick = () => addSort(h, false);
        return div;
      });
      const body = data.length > 1 ? data.slice(1 + n * pagen, 1 + (n + 1) * pagen) : [];
      body.unshift(header);
      divtbl.innerHTML = "";
      createTable(body, divtbl);
    };
    const showInit = (data2) => {
      showdata = data2;
      npage = Math.floor((showdata.length - 1) / pagen) + (showdata.length - 1 % pagen == 0 ? 0 : 1);
      page = 0;
      nview.value = "表示件数: " + showdata.length + " / " + data.length;

      sel.innerHTML = "";
      for (let i = 1; i <= npage; i++) {
        create("option", sel).textContent = "page " + i;
      }
      show(0);
    };
    let sel = create("select");
    sel.onchange = () => show(parseInt(sel.value.split(" ")[1]) - 1);
    const div = create("div", this, "control");
    const inp = create("input", div);
    inp.placeholder = "全文検索フィルタ";
    inp.onchange = () => {
      const key = inp.value;
      const filtered = [data[0]];
      for (let i = 1; i < data.length; i++) {
        const d = data[i];
        for (const v of d) {
          if (v.indexOf(key) >= 0) {
            filtered.push(d);
          }
        }
      }
      console.log(filtered);
      showInit(filtered);
    };
    const btn = createButton("全件表示", div);
    btn.onclick = () => {
      showInit(data);
    };
    const nview = create("input", div);
    nview.disabled = true;
    [
      ["◀◀", () => show(0)],
      ["◀", () => show(page - 1)],
      ["sel"],
      ["▶", () => show(page + 1)],
      ["▶▶", () => show(npage - 1)]
    ].forEach(([label, func]) => {
      if (label == "sel") {
        div.appendChild(sel);
      } else {
        const span = create("span", div);
        span.textContent = label;
        span.onclick = func;
      }
    });
    showInit(data);
  }
}

customElements.define("table-view", TableView);

export { TableView } ;

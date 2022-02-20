import  djikstra  from "./djikstra.js";

onload = function () {
    let curr_data, V, src, dst;

    const container = document.getElementById('mynetwork');
    const container2 = document.getElementById('mynetwork2');
    const genNew = document.getElementById('generate-graph');
    const solve = document.getElementById('solve');
    const temptext = document.getElementById('temptext');
    const temptext2 = document.getElementById('temptext2');
    const cities = ['Brasília','São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Fortaleza', 'Goiânia', 'Santos', 'Recife'];

    
    const options = {
        edges: {
            labelHighlightBold: true,
            font: {
                size: 20
            }
        },
        nodes: {
            font: '12.5px arial black',
            scaling: {
                label: true
            },
            shape: 'icon',
            icon: {
                face: 'FontAwesome',
                code: '\uf64f',
                size: 40,
                color: '#118299',
            }
        }
    };

    
    const network = new vis.Network(container);
    network.setOptions(options);
    // Network for result graph
    const network2 = new vis.Network(container2);
    network2.setOptions(options);

    function createData() {
        V = Math.floor(Math.random() * 8) + 3; 
        let nodes = [];
        for (let i = 1; i <= V; i++) {
            nodes.push({ id: i, label: cities[i - 1] })
        }
        
        nodes = new vis.DataSet(nodes);

        
        let edges = [];
        for (let i = 2; i <= V; i++) {
            let neigh = i - Math.floor(Math.random() * Math.min(i - 1, 3) + 1); // Picks a neighbour from i-3 to i-1
            edges.push({ type: 0, from: i, to: neigh, color: 'orange', label: String(Math.floor(Math.random() * 70) + 31) });
        }

        
        for (let i = 1; i <= V / 2;) {

            let n1 = Math.floor(Math.random() * V) + 1;
            let n2 = Math.floor(Math.random() * V) + 1;
            if (n1 !== n2) {
                if (n1 < n2) {
                    let tmp = n1;
                    n1 = n2;
                    n2 = tmp;
                }
                
                let works = 0;
                for (let j = 0; j < edges.length; j++) {
                    if (edges[j]['from'] === n1 && edges[j]['to'] === n2) {
                        if (edges[j]['type'] === 0)
                            works = 1;
                        else
                            works = 2;
                    }
                }

                if (works <= 1) {
                    if (works === 0 && i < V / 4) {
                       
                        edges.push({
                            type: 0,
                            from: n1,
                            to: n2,
                            color: 'orange',
                            label: String(Math.floor(Math.random() * 70) + 31)
                        });
                    } else {
                       
                        edges.push({
                            type: 1,
                            from: n1,
                            to: n2,
                            color: 'green',
                            label: String(Math.floor(Math.random() * 50) + 1)
                        });
                    }
                    i++;
                }
            }
        }

        
        src = 1;
        dst = V;
        curr_data = {
            nodes: nodes,
            edges: edges
        };
    }

    genNew.onclick = function () {
        
        createData();
        network.setData(curr_data);
        temptext2.innerText = 'Encontre o menor tempo de viagem de ' + cities[src - 1] + ' para ' + cities[dst - 1];
        temptext.style.display = "inline";
        temptext2.style.display = "inline";
        container2.style.display = "none";

    };

    solve.onclick = function () {
       
        temptext.style.display = "none";
        temptext2.style.display = "none";
        container2.style.display = "inline";
        network2.setData(solveData());
    };

    function createGraph(data) {
        let graph = [];
        for (let i = 1; i <= V; i++) {
            graph.push([]);
        }

        for (let i = 0; i < data['edges'].length; i++) {
            let edge = data['edges'][i];
            if (edge['type'] === 1)
                continue;
            graph[edge['to'] - 1].push([edge['from'] - 1, parseInt(edge['label'])]);
            graph[edge['from'] - 1].push([edge['to'] - 1, parseInt(edge['label'])]);
        }
        return graph;
    }

    function shouldTakePlane(edges, dist1, dist2, mn_dist) {
        let plane = 0;
        let p1 = -1, p2 = -1;
        for (let pos in edges) {
            let edge = edges[pos];
           
            if (edge['type'] === 1) {
                let to = edge['to'] - 1;
                let from = edge['from'] - 1;
                let wght = parseInt(edge['label']);
                if (dist1[to][0] + wght + dist2[from][0] < mn_dist) {
                    plane = wght;
                    p1 = to;
                    p2 = from;
                    mn_dist = dist1[to][0] + wght + dist2[from][0];
                }
                if (dist2[to][0] + wght + dist1[from][0] < mn_dist) {
                    plane = wght;
                    p2 = to;
                    p1 = from;
                    mn_dist = dist2[to][0] + wght + dist1[from][0];
                }
            }
        }
        return { plane, p1, p2 };
    }

    function solveData() {

        const data = curr_data;

        
        const graph = createGraph(data);

        
        let dist1 = djikstra(graph, V, src - 1);
        let dist2 = djikstra(graph, V, dst - 1);

        
        let mn_dist = dist1[dst - 1][0];

        
        let { plane, p1, p2 } = shouldTakePlane(data['edges'], dist1, dist2, mn_dist);

        let new_edges = [];
        if (plane !== 0) {
            new_edges.push({ arrows: { to: { enabled: true } }, from: p1 + 1, to: p2 + 1, color: 'green', label: String(plane) });
            new_edges.push(...pushEdges(dist1, p1, false));
            new_edges.push(...pushEdges(dist2, p2, true));
        } else {
            new_edges.push(...pushEdges(dist1, dst - 1, false));
        }
        const ans_data = {
            nodes: data['nodes'],
            edges: new_edges
        };
        return ans_data;
    }

    function pushEdges(dist, curr, reverse) {
        let tmp_edges = [];
        while (dist[curr][0] !== 0) {
            let fm = dist[curr][1];
            if (reverse)
                tmp_edges.push({ arrows: { to: { enabled: true } }, from: curr + 1, to: fm + 1, color: 'orange', label: String(dist[curr][0] - dist[fm][0]) });
            else
                tmp_edges.push({ arrows: { to: { enabled: true } }, from: fm + 1, to: curr + 1, color: 'orange', label: String(dist[curr][0] - dist[fm][0]) });
            curr = fm;
        }
        return tmp_edges;
    }

    genNew.click();
};

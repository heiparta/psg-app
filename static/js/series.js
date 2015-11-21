/*jshint ignore:start */

var Player = React.createClass({
  render: function() {
    return (
      <li><a href="/app/player/{this.props.name}">{this.props.name}</a></li>
    );
  }
});

var PlayerList = React.createClass({
  render: function() {
    var playerNodes = this.props.players.map(function (player) {
      return (
        <Player key={player} name={player} />
      );
    });
    return (
      <ul className="playerList">
        {playerNodes}
      </ul>
    );
  }
});

var Series = React.createClass({
  getInitialState: function () {
    return { name: "", players: [] };
  },
  componentDidMount: function () {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ name: data.series.name, players: data.series.players });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
    });
  },
  render: function() {
    return (
      <div className="seriesDiv">
        <h1>Series {this.state.name}</h1>
        <PlayerList players={this.state.players} />

      </div>
    );
  }
});

var App = React.createClass({
  render() {
    return (
      <div>
        <h1>PSG stats</h1>
        <ul>
          <li><Link to="/series/testseries">testseries</Link></li>
        </ul>

        {this.props.children}
      </div>
    )
  }
})

ReactDOM.render(
  <Series url="http://localhost:8080/series/testseries" />,
  document.getElementById('content')
);

//ReactDOM.render((
  //<Router>
    //<Route path="/app" component={App}>
      //<Route path="series/:name" component={Series} />
      //<Route path="user" component={User} />
    //</Route>
  //</Router>
//), document.body)
/*jshint ignore:end */


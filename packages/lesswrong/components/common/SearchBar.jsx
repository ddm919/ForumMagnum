import React, { Component } from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import { InstantSearch, SearchBox, connectMenu } from 'react-instantsearch-dom';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import Portal from '@material-ui/core/Portal';
import { addCallback, removeCallback } from 'meteor/vulcan:lib';
import { withLocation } from '../../lib/routeUtil';
import withErrorBoundary from '../common/withErrorBoundary';
import { algoliaIndexNames, isAlgoliaEnabled, getSearchClient } from '../../lib/algoliaUtil';

const VirtualMenu = connectMenu(() => null);

const styles = theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  rootChild: {
    height: 'fit-content'
  },
  searchInputArea: {
    display: "block",
    position: "relative",
    minWidth: 48,
    height: 48,

    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      maxWidth: 300,
      width: '100%',
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      fontSize: 14,
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit":{
      display: "none"
    },
    // This is a class generated by React InstantSearch, which we don't have direct control over so
    // are doing a somewhat hacky thing to style it.
    "& .ais-SearchBox-input": {
      display:"none",

      height: "100%",
      width: "100%",
      paddingRight: 0,
      paddingLeft: 48,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      fontSize: 'inherit',
      "-webkit-appearance": "none",
      cursor: "text",
      borderRadius:5,

      [theme.breakpoints.down('tiny')]: {
        backgroundColor: "#eee",
        zIndex: theme.zIndexes.searchBar,
        width:110,
        height:36,
        paddingLeft:10
      },
    },
    "&.open .ais-SearchBox-input": {
      display:"inline-block",
    },
  },
  searchIcon: {
    position: 'fixed',
    margin: '12px',
  },
  closeSearchIcon: {
    fontSize: 14,
  },
  searchBarClose: {
    display: "inline-block",
    position: "absolute",
    top: 15,
    right: 5,
    cursor: "pointer"
  },
  alignmentForum: {
    "& .ais-SearchBox-input": {
      color: "white",
    },
    "& .ais-SearchBox-input::placeholder": {
      color: "rgba(255,255,255, 0.5)",
    },
  },
})

class SearchBar extends Component {
  constructor(props){
    super(props);
    this.state = {
      inputOpen: false,
      searchOpen: false,
      currentQuery: "",
    }
  }

  componentDidMount() {
    let _this = this;
    this.routerUpdateCallback = function closeSearchOnNavigate() {
      _this.closeSearch();
    };
    addCallback('router.onUpdate', this.routerUpdateCallback);
  }

  componentWillUnmount() {
    if (this.routerUpdateCallback) {
      removeCallback('router.onUpdate', this.routerUpdateCallback);
      this.routerUpdateCallback = null;
    }
  }


  openSearchResults = () => {
    this.setState({searchOpen: true});
  }

  closeSearchResults = () => {
    this.setState({searchOpen: false});
  }

  closeSearch = () => {
    this.setState({searchOpen: false, inputOpen: false});
    if (this.props.onSetIsActive)
      this.props.onSetIsActive(false);
  }

  handleSearchTap = () => {
    this.setState({inputOpen: true, searchOpen: this.state.currentQuery});
    if (this.props.onSetIsActive)
      this.props.onSetIsActive(true);
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape') this.closeSearch();
  }

  queryStateControl = (searchState) => {
    if (searchState.query !== this.state.currentQuery) {
      this.setState({currentQuery: searchState.query});
      if (searchState.query) {
        this.openSearchResults();
      } else {
        this.closeSearchResults();
      }
    }
  }

  render() {
    const alignmentForum = getSetting('forumType') === 'AlignmentForum';

    const { searchResultsArea, classes } = this.props
    const { location } = this.props; // From withLocation
    const { searchOpen, inputOpen } = this.state

    if(!isAlgoliaEnabled) {
      return <div>Search is disabled (Algolia App ID not configured on server)</div>
    }

    // HACK FIXME: This should very likely be factored out somewhere close to where the routes lives, to avoid breaking when we make small URL changes
    let userRefinement
    if(location && location.pathname && location.pathname.includes("/users/")){
      userRefinement = location.pathname.split('/')[2]
    }

    return <div className={classes.root} onKeyDown={this.handleKeyDown}>
      <div className={classes.rootChild}>
        <InstantSearch
          indexName={algoliaIndexNames.Posts}
          searchClient={getSearchClient()}
          onSearchStateChange={this.queryStateControl}
        >
          <div className={classNames(
            classes.searchInputArea,
            {"open": inputOpen},
            {[classes.alignmentForum]: alignmentForum}
          )}>
            {alignmentForum && <VirtualMenu attribute="af" defaultRefinement="true" />}
            {userRefinement && <VirtualMenu attribute='authorSlug' defaultRefinement={userRefinement} />}
            <div onClick={this.handleSearchTap}>
              <SearchIcon className={classes.searchIcon}/>
              { inputOpen && <SearchBox reset={null} focusShortcuts={[]} autoFocus={true} /> }
            </div>
            { searchOpen && <div className={classes.searchBarClose} onClick={this.closeSearch}>
              <CloseIcon className={classes.closeSearchIcon}/>
            </div>}
            <div>
              { searchOpen && <Portal container={searchResultsArea.current}>
                  <Components.SearchBarResults closeSearch={this.closeSearch} />
                </Portal> }
            </div>
          </div>
        </InstantSearch>
      </div>
    </div>
  }
}

SearchBar.propTypes = {
  color: PropTypes.string,
  onSetIsActive: PropTypes.func,
};

SearchBar.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

registerComponent("SearchBar", SearchBar, withStyles(styles, {name: "SearchBar"}), withLocation, withErrorBoundary);

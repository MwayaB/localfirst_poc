import {now} from '../utils/helpers'

const Navbar = () => {
  return (
<nav className="navbar navbar-expand-lg bg-success-dark py-2 custom-navbar">
  <div className="container-fluid justify-content-between align-items-center">
 
    <div className="d-flex align-items-center me-3">
      <button className="btn btn-link text-white me-2" type="button">
        <i className="bi bi-list fs-4"></i>
      </button>
      <div className="d-none d-sm-block text-white">
        <div className="fw-bold small">MaHIS (AETC)</div>
        <div className="small">
          Queen Elizabeth Central Hospital |
          <span className="text-lime ms-1">{now.toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
 <form className="d-none d-lg-flex align-items-center w-50 me-auto">
  <div className="input-group search-bar">
    <span className="input-group-text bg-white rounded-0 rounded-start">
      <i className="bi bi-search"></i>
    </span>
    <input
      type="text"
      className="form-control border-start-0 rounded-0"
      placeholder="Search by MRN, name, or barcode"
    />
    <button className="btn btn-contrast rounded-end" type="button">
      <i className="bi bi-person-plus"></i>
    </button>
  </div>
</form>

    <div className="d-flex align-items-center">
      <button className="btn btn-link text-white me-2">
        <i className="bi bi-bell fs-5"></i>
      </button>
      <div className="dropdown">
        <button
          className="btn btn-link text-white"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="bi bi-person-circle fs-5"></i>
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><a className="dropdown-item" href="#">Profile</a></li>
          <li><a className="dropdown-item" href="#">My Account</a></li>
          <li><hr className="dropdown-divider" /></li>
          <li><a className="dropdown-item text-danger" href="#">Logout</a></li>
        </ul>
      </div>
    </div>

  </div>
</nav>
  );
};

export default Navbar;